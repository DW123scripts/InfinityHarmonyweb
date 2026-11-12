const editor=document.querySelector('#editor-frame'), preview=document.querySelector('#preview-frame'), settingsFrame=document.querySelector('#settings-frame'), piano=document.querySelector('#piano-frame'), workspace=document.querySelector('#workspace'), divider=document.querySelector('#workspace-divider'), restorePreview=document.querySelector('#restore-preview');let currentPage='studio',previewVisible=true,leftShare=.64,dragging=false;
function applySettings(settings){if(!settings.showPreview)previewVisible=true;document.body.classList.toggle('settings-mode',currentPage==='settings');document.body.classList.toggle('no-piano',!settings.showPiano);document.body.classList.toggle('no-preview',!settings.showPreview||currentPage==='songbook'||currentPage==='settings');document.body.classList.toggle('preview-collapsed',settings.showPreview&&currentPage==='studio'&&!previewVisible);editor.style.display=currentPage==='settings'?'none':'block';settingsFrame.style.display=currentPage==='settings'?'block':'none';preview.style.display=currentPage==='settings'||currentPage==='songbook'||!settings.showPreview||!previewVisible?'none':'block';piano.style.display=settings.showPiano?'block':'none';document.documentElement.style.colorScheme=settings.theme==='dark'?'dark':'light';document.body.style.background=settings.theme==='dark'?'#0f172a':'#eef2f7';try{editor.contentDocument.body.classList.toggle('dark-mode',settings.theme==='dark');preview.contentDocument.body.style.background=settings.theme==='dark'?'#0f172a':'#f8fafc';preview.contentDocument.body.style.color=settings.theme==='dark'?'#f1f5f9':'#172033'}catch{}syncWorkspaceSize()}
function readSettings(){try{return{theme:'light',showPreview:true,showPiano:true,keyboardPiano:true,keyboardZeroKey:'1',...JSON.parse(localStorage.getItem('infinity_harmony_settings_v1')||'{}')}}catch{return{theme:'light',showPreview:true,showPiano:true,keyboardPiano:true,keyboardZeroKey:'1'}}}
function navigate(page){currentPage=page;document.body.classList.toggle('settings-mode',page==='settings');if(page==='songbook'){editor.contentWindow.switchPage?.('songbook')}else if(page==='studio'){editor.contentWindow.switchPage?.('studio')}applySettings(readSettings())}
window.addEventListener('message',event=>{if(event.origin!==location.origin)return;const message=event.data||{};if(message.type==='infinity:navigate')navigate(message.page);if(message.type==='infinity:settings')applySettings(message.settings);if(message.type==='infinity:piano-note')editor.contentWindow.addNote?.(message.note);if(message.type==='infinity:editor-state')preview.contentWindow.postMessage(message,location.origin)});
editor.addEventListener('load',()=>{if(currentPage==='songbook')editor.contentWindow.switchPage?.('songbook');applySettings(readSettings())});window.addEventListener('DOMContentLoaded',()=>applySettings(readSettings()));applySettings(readSettings());
function syncWorkspaceSize(){
    const settings=readSettings();
    if(!previewVisible||!settings.showPreview||currentPage!=='studio'){workspace.style.gridTemplateColumns='';workspace.style.gridTemplateRows='';return}
    if(window.matchMedia('(max-width: 850px)').matches){workspace.style.gridTemplateColumns='';workspace.style.gridTemplateRows=`minmax(0,${leftShare}fr) 10px minmax(0,${1-leftShare}fr)`}
    else{workspace.style.gridTemplateRows='';workspace.style.gridTemplateColumns=`minmax(0,${leftShare}fr) 10px minmax(0,${1-leftShare}fr)`}
}
const numericKeyOrder=['1','2','3','4','5','6','7','8','9','0'];
const noteLetters=['C','D','E','F','G','A','B'];
let keyboardSharpHeld=false;
function abcNoteForKeyboardStep(step,sharp){
    const octave=Math.floor(step/7),letterIndex=((step%7)+7)%7,letter=noteLetters[letterIndex];
    let note=octave===0?letter:octave>0?letter.toLowerCase()+"'".repeat(octave-1):letter+','.repeat(-octave);
    if(sharp)note='^'+note;
    return note;
}
function handlePianoKeyboard(event,source){
    if(event.type==='keyup'){
        if(event.code==='Space')keyboardSharpHeld=false;
        return;
    }
    const settings=readSettings();
    if(!settings.keyboardPiano||event.ctrlKey||event.metaKey||event.altKey)return;
    const editorDoc=editor.contentDocument;
    const voiceInput=editor.contentWindow.lastFocusedInput;
    if(!voiceInput||!voiceInput.isConnected||!voiceInput.classList.contains('voice-input'))return;
    if(!editorDoc.querySelector('#keyboardToggle')?.checked)return;
    if(source==='editor'&&editorDoc.activeElement!==voiceInput)return;
    if(event.code==='Space'){
        keyboardSharpHeld=true;
        event.preventDefault();
        return;
    }
    if(event.repeat)return;
    const codeMatch=event.code.match(/^(?:Digit|Numpad)([0-9])$/);
    if(!codeMatch)return;
    const pressedIndex=numericKeyOrder.indexOf(codeMatch[1]);
    const zeroIndex=numericKeyOrder.indexOf(settings.keyboardZeroKey);
    if(pressedIndex<0||zeroIndex<0)return;
    event.preventDefault();
    editor.contentWindow.addNote(abcNoteForKeyboardStep(pressedIndex-zeroIndex,keyboardSharpHeld));
}
let editorKeyboardInstalled=false,pianoKeyboardInstalled=false;
function installKeyboardListeners(frame,source){
    const isEditor=source==='editor';
    if((isEditor&&editorKeyboardInstalled)||(!isEditor&&pianoKeyboardInstalled))return;
    const frameDocument=frame.contentDocument;
    if(!frameDocument)return;
    frameDocument.addEventListener('keydown',event=>handlePianoKeyboard(event,source));
    frameDocument.addEventListener('keyup',event=>handlePianoKeyboard(event,source));
    if(isEditor)editorKeyboardInstalled=true;else pianoKeyboardInstalled=true;
}
editor.addEventListener('load',()=>installKeyboardListeners(editor,'editor'));
piano.addEventListener('load',()=>installKeyboardListeners(piano,'piano'));
if(editor.contentDocument?.readyState==='complete')installKeyboardListeners(editor,'editor');
if(piano.contentDocument?.readyState==='complete')installKeyboardListeners(piano,'piano');
window.addEventListener('blur',()=>{keyboardSharpHeld=false});
function resizeWorkspace(event){
    if(!dragging)return;
    const rect=workspace.getBoundingClientRect();
    if(window.matchMedia('(max-width: 850px)').matches){
        leftShare=Math.max(.3,Math.min(.88,(event.clientY-rect.top)/rect.height));
        previewVisible=event.clientY<=rect.bottom-28;
    }else{
        leftShare=Math.max(.3,Math.min(.86,(event.clientX-rect.left)/rect.width));
        previewVisible=event.clientX<=rect.right-32;
    }
    syncWorkspaceSize();applySettings(readSettings());
    if(!previewVisible){dragging=false;document.body.classList.remove('resizing');if(divider.hasPointerCapture?.(event.pointerId))divider.releasePointerCapture(event.pointerId)}
}
divider.addEventListener('pointerdown',event=>{dragging=true;divider.setPointerCapture?.(event.pointerId);document.body.classList.add('resizing');event.preventDefault()});
window.addEventListener('pointermove',resizeWorkspace);
window.addEventListener('pointerup',()=>{if(!dragging)return;dragging=false;document.body.classList.remove('resizing')});
window.addEventListener('resize',syncWorkspaceSize);
restorePreview.addEventListener('click',()=>{previewVisible=true;syncWorkspaceSize();applySettings(readSettings())});
syncWorkspaceSize();
