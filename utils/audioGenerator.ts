/**
 * Generates a complex, multi-layered audio preview based on a text description.
 * This function is now a dynamic synthesizer that parses the description to decide
 * which instruments, scales, and effects to use.
 * @param description The detailed text description of the music from the AI.
 * @returns A promise that resolves to a Blob URL for the generated audio.
 */
export const generateAudioPreview = (description: string): Promise<string> => {
  return new Promise((resolve) => {
    const duration = 10; // 10 seconds
    const sampleRate = 44100;
    const context = new OfflineAudioContext(2, sampleRate * duration, sampleRate);
    const masterGain = context.createGain();
    masterGain.gain.value = 0.5;

    // --- Effects Chain ---
    const delay = context.createDelay(1.0);
    const feedback = context.createGain();
    feedback.gain.value = 0.4;
    const reverb = context.createConvolver();
    // Simple impulse response for reverb
    const impulse = context.createBuffer(2, 2 * sampleRate, sampleRate);
    for (let i = 0; i < 2; i++) {
        const chan = impulse.getChannelData(i);
        for (let j = 0; j < 2 * sampleRate; j++) {
            chan[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / (2 * sampleRate), 2);
        }
    }
    reverb.buffer = impulse;

    // Connect master gain to destination, potentially through effects
    masterGain.connect(context.destination);

    // --- Parameter Extraction from Description ---
    const lowerDesc = description.toLowerCase();
    
    // Connect effects if specified
    if (lowerDesc.includes('reverb')) {
      const reverbGain = context.createGain();
      reverbGain.gain.value = 0.6;
      masterGain.connect(reverb).connect(reverbGain).connect(context.destination);
    }
    if (lowerDesc.includes('delay')) {
      const delayGain = context.createGain();
      delayGain.gain.value = 0.5;
      masterGain.connect(delay);
      delay.connect(feedback).connect(delay);
      delay.connect(delayGain).connect(context.destination);
    }

    // Determine Tempo
    let bpm = 120;
    const bpmMatch = lowerDesc.match(/(\d+)\s*bpm/);
    if (bpmMatch) {
        bpm = parseInt(bpmMatch[1], 10);
    } else {
        if (lowerDesc.includes('slow')) bpm = 80;
        if (lowerDesc.includes('fast') || lowerDesc.includes('upbeat')) bpm = 140;
    }
    const beatDuration = 60 / bpm;

    // Determine Scale
    let scale = [0, 2, 4, 5, 7, 9, 11]; // Major default
    if (lowerDesc.includes('minor')) scale = [0, 2, 3, 5, 7, 8, 10];
    if (lowerDesc.includes('dissonant') || lowerDesc.includes('atonal')) scale = [0, 1, 4, 5, 8, 9]; // Dissonant scale
    if (lowerDesc.includes('pentatonic')) scale = [0, 2, 4, 7, 9];

    // Chord Progression (I-V-vi-IV in major, i-VI-III-VII in minor)
    const isMinor = lowerDesc.includes('minor');
    const chordProgression = isMinor ? [[0,3,7], [8,0,3], [3,7,10], [10,2,5]] : [[0,4,7], [7,11,2], [9,0,4], [5,9,0]];
    const baseFreq = 220; // A3

    // --- Dynamic Instrument Synthesis ---

    // 1. Percussion Layer
    const createDrums = () => {
      const gain = context.createGain();
      gain.gain.value = 0.8;
      gain.connect(masterGain);

      for (let i = 0; i < duration / beatDuration; i++) {
        const time = i * beatDuration;
        
        // Kick
        if (i % 2 === 0 || lowerDesc.includes('heartbeat')) {
            const kickEnv = context.createGain();
            kickEnv.connect(gain);
            const kickOsc = context.createOscillator();
            kickOsc.frequency.setValueAtTime(150, time);
            kickOsc.frequency.exponentialRampToValueAtTime(0.01, time + 0.1);
            kickEnv.gain.setValueAtTime(1, time);
            kickEnv.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
            kickOsc.connect(kickEnv);
            kickOsc.start(time);
            kickOsc.stop(time + 0.15);
        }

        // Snare (don't play if it's just a heartbeat)
        if (i % 2 !== 0 && !lowerDesc.includes('heartbeat')) {
            const snareEnv = context.createGain();
            snareEnv.connect(gain);
            const noise = context.createBufferSource();
            const buffer = context.createBuffer(1, sampleRate * 0.2, sampleRate);
            buffer.getChannelData(0).forEach((_, j, arr) => arr[j] = Math.random() * 2 - 1);
            noise.buffer = buffer;
            const noiseFilter = context.createBiquadFilter();
            noiseFilter.type = 'highpass';
            noiseFilter.frequency.value = 1500;
            noise.connect(noiseFilter).connect(snareEnv);
            snareEnv.gain.setValueAtTime(0.8, time);
            snareEnv.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
            noise.start(time);
            noise.stop(time + 0.15);
        }
      }
    };

    // 2. Harmony Layer (Pads, Strings, Chords)
    const createHarmony = () => {
        const gain = context.createGain();
        gain.gain.value = 0.4;
        const filter = context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        gain.connect(filter).connect(masterGain);

        let oscType: OscillatorType = 'sawtooth';
        if (lowerDesc.includes('choir') || lowerDesc.includes('soft')) oscType = 'sine';
        if (lowerDesc.includes('synth')) oscType = 'square';

        chordProgression.forEach((chord, i) => {
            const time = i * beatDuration * 4;
            chord.forEach(noteOffset => {
                // Create a richer sound with detuned oscillators for strings/pads
                const detuneAmount = lowerDesc.includes('string') ? 5 : 0;
                [-detuneAmount, 0, detuneAmount].forEach(detune => {
                    if (detune === 0 && detuneAmount !== 0) return; // create 2 detuned, not 3
                    const osc = context.createOscillator();
                    osc.type = oscType;
                    osc.detune.value = detune;
                    const freq = baseFreq * Math.pow(2, (noteOffset + scale[0]) / 12);
                    osc.frequency.setValueAtTime(freq, time);
                    osc.connect(gain);
                    osc.start(time);
                    osc.stop(time + beatDuration * 4);
                });
            });
        });
    };
    
    // 3. Bass Layer
    const createBass = () => {
        const gain = context.createGain();
        gain.gain.value = 0.7;
        const filter = context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        gain.connect(filter).connect(masterGain);

        let oscType: OscillatorType = 'square';
        if (lowerDesc.includes('rumble') || lowerDesc.includes('drone')) oscType = 'sine';

        chordProgression.forEach((chord, i) => {
            const time = i * beatDuration * 4;
            const rootNote = chord[0];
            const freq = (baseFreq / 2) * Math.pow(2, (rootNote + scale[0]) / 12);
            const osc = context.createOscillator();
            osc.type = oscType;
            osc.frequency.setValueAtTime(freq, time);
            osc.connect(gain);
            osc.start(time);
            osc.stop(time + beatDuration * 4);
        });
    };

    // 4. Melody Layer
    const createMelody = () => {
        const gain = context.createGain();
        gain.gain.value = 0.6;
        gain.connect(masterGain);

        let oscType: OscillatorType = 'triangle';
        if (lowerDesc.includes('bell') || lowerDesc.includes('music box') || lowerDesc.includes('glockenspiel')) oscType = 'sine';
        if (lowerDesc.includes('piano')) oscType = 'sine'; // Approximated with envelope
        
        for (let i = 0; i < duration / (beatDuration / 2); i++) {
            const time = i * (beatDuration / 2);
            const chordIndex = Math.floor(i / 8);
            const currentChord = chordProgression[chordIndex % chordProgression.length];
            
            if (Math.random() > 0.3) {
                const noteIndex = Math.floor(Math.random() * scale.length);
                const note = scale[noteIndex] + 12; // One octave higher
                const freq = baseFreq * Math.pow(2, note / 12);

                const osc = context.createOscillator();
                osc.type = oscType;
                if (lowerDesc.includes('detuned')) osc.detune.value = -25;
                osc.frequency.setValueAtTime(freq, time);

                const env = context.createGain();
                env.connect(gain);
                osc.connect(env);
                
                let attack = 0.05;
                let decayTime = time + beatDuration / 2;
                if (lowerDesc.includes('piano') || lowerDesc.includes('bell')) {
                    attack = 0.01;
                    decayTime = time + beatDuration * 2; // Longer decay
                }

                env.gain.setValueAtTime(0, time);
                env.gain.linearRampToValueAtTime(1, time + attack);
                env.gain.exponentialRampToValueAtTime(0.001, decayTime);

                osc.start(time);
                osc.stop(decayTime);
            }
        }
    };

    // --- Build Audio Based on Description ---
    if (lowerDesc.includes('drum') || lowerDesc.includes('beat') || lowerDesc.includes('percussion') || lowerDesc.includes('heartbeat')) {
      createDrums();
    }
    if (lowerDesc.includes('pad') || lowerDesc.includes('string') || lowerDesc.includes('choir') || lowerDesc.includes('chord')) {
      createHarmony();
    }
    if (lowerDesc.includes('bass') || lowerDesc.includes('drone') || lowerDesc.includes('rumble')) {
      createBass();
    }
    if (lowerDesc.includes('melody') || lowerDesc.includes('piano') || lowerDesc.includes('bell') || lowerDesc.includes('music box') || lowerDesc.includes('glockenspiel')) {
      createMelody();
    }

    context.startRendering().then((renderedBuffer) => {
      const wav = bufferToWav(renderedBuffer);
      const blob = new Blob([wav], { type: 'audio/wav' });
      resolve(URL.createObjectURL(blob));
    });
  });
};

// Helper function to convert an AudioBuffer to a WAV file (Blob)
function bufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferOut = new ArrayBuffer(length);
  const view = new DataView(bufferOut);
  let offset = 0;

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + buffer.length * numOfChan * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numOfChan, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * 2 * numOfChan, true);
  view.setUint16(32, numOfChan * 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, buffer.length * numOfChan * 2, true);

  offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numOfChan; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      const intSample = sample < 0 ? sample * 32768 : sample * 32767;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return bufferOut;
}