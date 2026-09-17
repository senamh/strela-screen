import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=file=>readFile(new URL('../ui/'+file,import.meta.url),'utf8');
const [editor,popup,editorCss,popupCss]=await Promise.all(['editor.html','popup.html','editor.css','popup.css'].map(read));

test('every static dialog has an existing, unique accessible heading',()=>{
  const ids=[...editor.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
  assert.equal(new Set(ids).size,ids.length);
  const dialogs=[...editor.matchAll(/<dialog\b([^>]*)>/g)];
  assert.equal(dialogs.length,5);
  for(const [,attributes] of dialogs){
    const title=attributes.match(/aria-labelledby="([^"]+)"/)?.[1];
    assert(title,attributes);
    assert.match(editor,new RegExp('<h2\\b[^>]*id="'+title+'"'),title);
    for(const id of (attributes.match(/aria-describedby="([^"]+)"/)?.[1]||'').split(' ').filter(Boolean))assert(ids.includes(id),id);
  }
});

test('editor and extension popup share their brand asset and page safety settings',()=>{
  for(const html of [editor,popup]){
    assert.match(html,/name="viewport" content="width=device-width,initial-scale=1"/);
    assert.match(html,/http-equiv="Content-Security-Policy"/);
    assert.match(html,/src="icons\/icon48\.png"[^>]*alt=""/);
    assert.doesNotMatch(html,/<(?:script|link|img)\b[^>]*(?:src|href)="https?:/);
  }
  // popup.js replaces the first paragraph with an actionable error message.
  assert.equal((popup.match(/<p\b/g)||[]).length,1);
});

test('feedback and result controls retain clear accessible descriptions',()=>{
  assert.match(editor,/<span id="saved" role="status">/);
  assert.match(editor,/<p id="progress-label" role="status">/);
  assert.match(editor,/<progress\b[^>]*aria-label="Processing progress"/);
  assert.match(editor,/id="export-result"[^>]*aria-label="Completed export"/);
  assert.match(editor,/id="points"[^>]*aria-label="Editable focus points"/);
  assert.match(editor,/id="clips"[^>]*aria-label="Video clips"/);
  assert.match(editor,/id="speedup"/);
  assert.match(editor,/Their audio is muted\./);
});

test('shared controls support reduced motion, narrow screens and explicit keyboard focus',()=>{
  for(const css of [editorCss,popupCss]){
    assert.match(css,/prefers-reduced-motion:\s*reduce/);
    assert.match(css,/:focus-visible/);
    assert.match(css,/forced-colors:\s*active/);
    assert.match(css,/var\(--radius-control\)/);
    assert.match(css,/var\(--font\)/);
  }
  assert.match(editorCss,/max-height:\s*calc\(100dvh - 32px\)/);
  assert.match(editorCss,/max-width:\s*480px/);
  assert.match(editorCss,/\.document span[^}]*overflow-wrap:\s*anywhere/);
  assert.doesNotMatch(editorCss,/\.document span[^}]*display:\s*none/);
  assert.match(editorCss,/\.preview-shell\s*\{[^}]*background:\s*var\(--video-bg\)/);
});
