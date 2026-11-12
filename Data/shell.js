const editor=document.querySelector('#editor-frame'), preview=document.querySelector('#preview-frame'), settingsFrame=document.querySelector('#settings-frame'), piano=document.querySelector('#piano-frame'), workspace=document.querySelector('#workspace'), divider=document.querySelector('#workspace-divider'), restorePreview=document.querySelector('#restore-preview');let currentPage='studio',previewVisible=true,leftShare=.64,dragging=false;
function applySettings(settings){if(!settings.showPreview)previewVisible=true;document.body.classList.toggle('settings-mode',currentPage==='settings');document.body.classList.toggle('no-piano',!settings.showPiano);document.body.classList.toggle('no-preview',!settings.showPreview||currentPage==='songbook'||currentPage==='settings');document.body.classList.toggle('preview-collapsed',settings.showPreview&&currentPage==='studio'&&!previewVisible);editor.style.display=currentPage==='settings'?'none':'block';settingsFrame.style.display=currentPage==='settings'?'block':'none';preview.style.display=currentPage==='settings'||currentPage==='songbook'||!settings.showPreview||!previewVisible?'none':'block';piano.style.display=settings.showPiano?'block':'none';document.documentElement.style.colorScheme=settings.theme==='dark'?'dark':'light';document.body.style.background=settings.theme==='dark'?'#0f172a':'#eef2f7';try{editor.contentDocument.body.classList.toggle('dark-mode',settings.theme==='dark');preview.contentDocument.body.style.background=settings.theme==='dark'?'#0f172a':'#f8fafc';preview.contentDocument.body.style.color=settings.theme==='dark'?'#f1f5f9':'#172033'}catch{}syncWorkspaceSize()}
function readSettings(){try{return{theme:'light',showPreview:true,showPiano:true,...JSON.parse(localStorage.getItem('infinity_harmony_settings_v1')||'{}')}}catch{return{theme:'light',showPreview:true,showPiano:true}}}
function navigate(page){currentPage=page;document.body.classList.toggle('settings-mode',page==='settings');if(page==='songbook'){editor.contentWindow.switchPage?.('songbook')}else if(page==='studio'){editor.contentWindow.switchPage?.('studio')}applySettings(readSettings())}
window.addEventListener('message',event=>{if(event.origin!==location.origin)return;const message=event.data||{};if(message.type==='infinity:navigate')navigate(message.page);if(message.type==='infinity:settings')applySettings(message.settings);if(message.type==='infinity:piano-note')editor.contentWindow.addNote?.(message.note);if(message.type==='infinity:editor-state')preview.contentWindow.postMessage(message,location.origin)});
editor.addEventListener('load',()=>{if(currentPage==='songbook')editor.contentWindow.switchPage?.('songbook');applySettings(readSettings())});window.addEventListener('DOMContentLoaded',()=>applySettings(readSettings()));applySettings(readSettings());
function syncWorkspaceSize(){
    const settings=readSettings();
    if(!previewVisible||!settings.showPreview||currentPage!=='studio'){workspace.style.gridTemplateColumns='';workspace.style.gridTemplateRows='';return}
    if(window.matchMedia('(max-width: 850px)').matches){workspace.style.gridTemplateColumns='';workspace.style.gridTemplateRows=`minmax(0,${leftShare}fr) 10px minmax(0,${1-leftShare}fr)`}
    else{workspace.style.gridTemplateRows='';workspace.style.gridTemplateColumns=`minmax(0,${leftShare}fr) 10px minmax(0,${1-leftShare}fr)`}
}
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
