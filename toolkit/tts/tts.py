import sys, json, re, subprocess, os, numpy as np, onnxruntime as ort, wave
D=os.path.dirname(os.path.abspath(__file__))
VOC=json.load(open((D+'/config.json' if os.path.exists(D+'/config.json') else D+'/kx/src/kokoro_onnx/config.json')))['vocab']
sess=ort.InferenceSession(D+'/kokoro.onnx',providers=['CPUExecutionProvider'])
VOICES=np.load(D+'/voices.bin')
INS={i.name:i for i in sess.get_inputs()}
TOK='input_ids' if 'input_ids' in INS else 'tokens'
def ipa(text):
    env=dict(os.environ,LD_LIBRARY_PATH=D+'/piper')
    r=subprocess.run([D+'/piper/espeak-ng','--path='+D+'/piper','-q','--ipa','-v','en-gb',text],capture_output=True,text=True,env=env)
    return ' '.join(r.stdout.split())
def phon_words(text):
    # returns list of (word, phoneme string incl trailing punct)
    out=[]
    for w in text.split():
        m=re.match(r"^(.*?)([.,!?;:…]*)$",w); core,p=m.group(1),m.group(2)
        ph=ipa(core) if re.search(r'[A-Za-z0-9£]',core) else ''
        p=p.replace('…','.')
        out.append((w,ph+p))
    return out
def sent_ipa(text):
    # phonemize clause by clause (keeps natural reductions), single capital letters spoken as letters
    out=[]
    for part in re.findall(r"[^.,!?;:]+[.,!?;:]*", text):
        m=re.match(r"^(.*?)([.,!?;:]*)$",part.strip()); body,p=m.group(1),m.group(2)
        toks=body.split(); buf=[]; ph=[]
        for tk in toks:
            if re.fullmatch(r"[A-Z]",tk):
                if buf: ph.append(ipa(' '.join(buf))); buf=[]
                ph.append(ipa(tk+'.').rstrip('.'))
            else: buf.append(tk)
        if buf: ph.append(ipa(' '.join(buf)))
        out.append(' '.join(x for x in ph if x)+p)
    return ' '.join(out)
def synth(text,voice='bm_george',speed=1.0):
    pw=phon_words(text)
    ids=[VOC[c] for c in sent_ipa(text) if c in VOC]
    style=VOICES[voice][min(len(ids),len(VOICES[voice])-1)]
    feeds={TOK:np.array([[0,*ids,0]],dtype=np.int64),'style':np.asarray(style,dtype=np.float32).reshape(1,-1),'speed':np.array([speed],dtype=np.float32)}
    outs=sess.run(None,feeds)
    audio=np.asarray(outs[0]).ravel()
    words=[]
    if False:
        dur=np.asarray(outs[1]).ravel().astype(float)  # frames per token incl bos/eos
        hop=len(audio)/dur.sum()
        cum=np.concatenate([[0],np.cumsum(dur)])
        for (w,_),(a,b) in zip(pw,spans):
            t0=cum[a+1]*hop/24000; t1=cum[b+1]*hop/24000
            words.append({'w':w,'t0':round(t0,3),'t1':round(t1,3)})
    return audio,words
if __name__=='__main__':
    print([ (i.name,i.shape,i.type) for i in sess.get_inputs()],[o.name for o in sess.get_outputs()])
    a,w=synth(sys.argv[1] if len(sys.argv)>1 else 'You fall asleep in your car after a night out. Ten points.')
    import scipy.io.wavfile as wf; wf.write('/tmp/t.wav',24000,(a*32767).astype(np.int16)); print(len(a)/24000, w)
