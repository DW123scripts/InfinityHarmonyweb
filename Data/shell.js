const editor=document.querySelector('#editor-frame'), preview=document.querySelector('#preview-frame'), settingsFrame=document.querySelector('#settings-frame'), piano=document.querySelector('#piano-frame'), workspace=document.querySelector('#workspace'), divider=document.querySelector('#workspace-divider'), restorePreview=document.querySelector('#restore-preview');let currentPage='studio',previewVisible=true,leftShare=.64,dragging=false;
function applySettings(settings){if(!settings.showPreview)previewVisible=true;document.body.classList.toggle('settings-mode',currentPage==='settings');document.body.classList.toggle('no-piano',!settings.showPiano||settings.mode!=='piano');document.body.classList.toggle('no-preview',!settings.showPreview||currentPage==='songbook'||currentPage==='settings');document.body.classList.toggle('preview-collapsed',settings.showPreview&&currentPage==='studio'&&!previewVisible);editor.style.display=currentPage==='settings'?'none':'block';settingsFrame.style.display=currentPage==='settings'?'block':'none';preview.style.display=currentPage==='settings'||currentPage==='songbook'||!settings.showPreview||!previewVisible?'none':'block';piano.style.display=settings.showPiano&&settings.mode==='piano'?'block':'none';document.documentElement.style.colorScheme=settings.theme==='dark'?'dark':'light';document.body.style.background=settings.theme==='dark'?'#0f172a':'#eef2f7';try{const dark=settings.theme==='dark';editor.contentDocument.body.classList.toggle('dark-mode',dark);editor.contentWindow.setInputMode?.(settings.mode);preview.contentDocument.body.classList.toggle('dark',dark);piano.contentDocument.body.classList.toggle('dark',dark);const nav=document.querySelector('#navigation').contentDocument;nav.body.classList.toggle('dark',dark);const cd=document.querySelector('#controls-frame').contentDocument;cd.body.classList.toggle('dark',dark);const settingsDoc=settingsFrame.contentDocument;settingsDoc.body.classList.toggle('dark',dark);let style=preview.contentDocument.querySelector('#infinity-dark-theme');if(!style){style=preview.contentDocument.createElement('style');style.id='infinity-dark-theme';preview.contentDocument.head.append(style)}style.textContent=dark?'body.dark{background:#0f172a;color:#f1f5f9}body.dark .top,body.dark .score{background:#1e293b;color:#f1f5f9;border-color:#334155}body.dark .hint,body.dark .empty,body.dark .credits{color:#cbd5e1}body.dark .abcjs-note{fill:#f1f5f9}body.dark button{background:#334155;color:#f1f5f9}':'body.dark{background:#f8fafc;color:#172033}body.dark .top{background:#fff;color:#172033}body.dark .score{background:#fff;color:#172033;border-color:#e2e8f0}body.dark .abcjs-note{fill:#172033}';let settingsStyle=settingsDoc.querySelector('#infinity-dark-theme');if(!settingsStyle){settingsStyle=settingsDoc.createElement('style');settingsStyle.id='infinity-dark-theme';settingsDoc.head.append(settingsStyle)}settingsStyle.textContent=dark?'body.dark{background:#0f172a!important;color:#f1f5f9!important}body.dark p,body.dark small{color:#cbd5e1!important}body.dark .setting{border-color:#334155}body.dark select,body.dark input{background:#1e293b;color:#f1f5f9;border-color:#475569}':'body.dark{background:#f8fafc!important;color:#172033!important}'}catch{}syncWorkspaceSize()}
function readSettings(){try{const value=JSON.parse(localStorage.getItem('infinity_harmony_settings_v1')||'{}');return{theme:'light',showPreview:true,showPiano:true,mode:value.keyboardPiano===false?'type':'piano',keyboardZeroKey:'1',...value}}catch{return{theme:'light',showPreview:true,showPiano:true,mode:'piano',keyboardZeroKey:'1'}}}
function navigate(page){currentPage=page;document.body.classList.toggle('settings-mode',page==='settings');if(page==='songbook'){editor.contentWindow.switchPage?.('songbook')}else if(page==='studio'){editor.contentWindow.switchPage?.('studio')}applySettings(readSettings())}
window.addEventListener('message',event=>{if(event.origin!==location.origin)return;const message=event.data||{};if(message.type==='infinity:navigate')navigate(message.page);if(message.type==='infinity:settings')applySettings(message.settings);if(message.type==='infinity:piano-note')editor.contentWindow.addNote?.(message.note);if(message.type==='infinity:editor-action')editor.contentWindow.handleToolbarAction?.(message.action,message.value);if(message.type==='infinity:input-mode')editor.contentWindow.setInputMode?.(message.mode);if(message.type==='infinity:editor-state')preview.contentWindow.postMessage(message,location.origin)});
editor.addEventListener('load',()=>{if(currentPage==='songbook')editor.contentWindow.switchPage?.('songbook');applySettings(readSettings())});window.addEventListener('DOMContentLoaded',()=>applySettings(readSettings()));applySettings(readSettings());
for(const frame of [document.querySelector('#navigation'),preview,settingsFrame,piano,document.querySelector('#controls-frame')])frame.addEventListener('load',()=>applySettings(readSettings()));
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
        if(event.code==='Space'||event.key===' ')keyboardSharpHeld=false;
        return;
    }
    const settings=readSettings();
    const keyboardMode=settings.mode?['numbers','piano'].includes(settings.mode):settings.keyboardPiano===true;
    if(!keyboardMode||event.ctrlKey||event.metaKey||event.altKey)return;
    const voiceInput=editor.contentWindow.getLastFocusedInput?.();
    if(!voiceInput||!voiceInput.isConnected||!voiceInput.classList.contains('voice-input'))return;
    if(event.code==='Backspace'||event.key==='Backspace') {event.preventDefault();editor.contentWindow.handleBackspace?.();return}
    if(event.code==='Space'||event.key===' '){
        keyboardSharpHeld=true;
        event.preventDefault();
        return;
    }
    if(event.repeat)return;
    const codeMatch=event.code.match(/^(?:Digit|Numpad)([0-9])$/)||(event.key.match(/^[0-9]$/)?[null,event.key]:null);
    if(!codeMatch)return;
    const pressedIndex=numericKeyOrder.indexOf(codeMatch[1]);
    const zeroIndex=numericKeyOrder.indexOf(settings.keyboardZeroKey);
    if(pressedIndex<0||zeroIndex<0)return;
    event.preventDefault();
    editor.contentWindow.addNote(abcNoteForKeyboardStep(pressedIndex-zeroIndex,keyboardSharpHeld));
}
const keyboardListenersInstalled=new WeakSet();
function installKeyboardListeners(frame,source='frame'){
    if(keyboardListenersInstalled.has(frame))return;
    const frameDocument=frame.contentDocument;
    if(!frameDocument)return;
    frameDocument.addEventListener('keydown',event=>handlePianoKeyboard(event,source),true);
    frameDocument.addEventListener('keyup',event=>handlePianoKeyboard(event,source),true);
    keyboardListenersInstalled.add(frame);
}
const keyboardFrames=[editor,piano,document.querySelector('#controls-frame'),document.querySelector('#navigation'),preview,settingsFrame];
for(const frame of keyboardFrames){frame.addEventListener('load',()=>installKeyboardListeners(frame));if(frame.contentDocument?.readyState==='complete')installKeyboardListeners(frame)}
window.addEventListener('keydown',event=>handlePianoKeyboard(event,'shell'),true);
window.addEventListener('keyup',event=>handlePianoKeyboard(event,'shell'),true);
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
