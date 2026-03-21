// BGMシステム - Web Audio API でチップチューン風BGMを生成
const BGM = (() => {
  let audioCtx = null;
  let currentTrack = null;
  let currentNodes = []; // 再生中のノードを管理
  let masterGain = null;
  let started = false;

  // 音名→周波数
  const NOTE_FREQ = {
    'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
    'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
    'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
    'Db3': 138.59, 'Eb3': 155.56, 'Gb3': 185.00, 'Ab3': 207.65, 'Bb3': 233.08,
    'Db4': 277.18, 'Eb4': 311.13, 'Gb4': 369.99, 'Ab4': 415.30, 'Bb4': 466.16,
    'Db5': 554.37, 'Eb5': 622.25, 'Gb5': 739.99, 'Ab5': 830.61, 'Bb5': 932.33,
  };

  function init() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.3;
    masterGain.connect(audioCtx.destination);
  }

  // ユーザー操作後に呼ぶ（AudioContext の制限解除）
  function unlock() {
    if (!audioCtx) init();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    started = true;
  }

  function stopAll() {
    currentNodes.forEach(n => {
      try { n.stop(); } catch (e) { /* ignore */ }
    });
    currentNodes = [];
  }

  // 矩形波を作る
  function playNote(freq, startTime, duration, type, vol) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type || 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol || 0.15, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration - 0.01);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(startTime);
    osc.stop(startTime + duration);
    currentNodes.push(osc);
    return osc;
  }

  // メロディを再生しループ
  function playTrack(trackName) {
    if (currentTrack === trackName) return;
    if (!started) return;
    stopAll();
    currentTrack = trackName;

    const track = TRACKS[trackName];
    if (!track) return;

    function scheduleLoop() {
      if (currentTrack !== trackName) return;
      const now = audioCtx.currentTime + 0.05;
      const loopDur = scheduleTrack(track, now);
      // ループ予約
      setTimeout(() => scheduleLoop(), (loopDur - 0.5) * 1000);
    }
    scheduleLoop();
  }

  function scheduleTrack(track, startTime) {
    const bpm = track.bpm || 140;
    const beatDur = 60 / bpm;
    let maxTime = 0;

    // メロディ
    if (track.melody) {
      let t = startTime;
      for (const note of track.melody) {
        if (note === '_') {
          t += beatDur * 0.5;
        } else {
          const dur = (note.dur || 0.5) * beatDur;
          const freq = NOTE_FREQ[note.n];
          if (freq) playNote(freq, t, dur * 0.9, 'square', 0.12);
          t += dur;
        }
      }
      maxTime = Math.max(maxTime, t - startTime);
    }

    // ベース
    if (track.bass) {
      let t = startTime;
      for (const note of track.bass) {
        if (note === '_') {
          t += beatDur * 0.5;
        } else {
          const dur = (note.dur || 0.5) * beatDur;
          const freq = NOTE_FREQ[note.n];
          if (freq) playNote(freq, t, dur * 0.9, 'triangle', 0.18);
          t += dur;
        }
      }
      maxTime = Math.max(maxTime, t - startTime);
    }

    // ドラム（ノイズベース）
    if (track.drums) {
      let t = startTime;
      for (const hit of track.drums) {
        if (hit === '_') {
          t += beatDur * 0.5;
        } else {
          const dur = (hit.dur || 0.5) * beatDur;
          if (hit.type === 'kick') {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(150, t);
            osc.frequency.exponentialRampToValueAtTime(30, t + 0.08);
            gain.gain.setValueAtTime(0.3, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
            osc.connect(gain); gain.connect(masterGain);
            osc.start(t); osc.stop(t + 0.12);
            currentNodes.push(osc);
          } else if (hit.type === 'snare') {
            const bufSize = audioCtx.sampleRate * 0.06;
            const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
            const src = audioCtx.createBufferSource();
            const gain = audioCtx.createGain();
            src.buffer = buf;
            gain.gain.setValueAtTime(0.15, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
            src.connect(gain); gain.connect(masterGain);
            src.start(t);
            currentNodes.push(src);
          } else if (hit.type === 'hat') {
            const bufSize = audioCtx.sampleRate * 0.03;
            const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.15;
            const src = audioCtx.createBufferSource();
            const gain = audioCtx.createGain();
            src.buffer = buf;
            gain.gain.setValueAtTime(0.08, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
            src.connect(gain); gain.connect(masterGain);
            src.start(t);
            currentNodes.push(src);
          }
          t += dur;
        }
      }
    }

    // 古いノードをクリーンアップ
    const cutoff = audioCtx.currentTime;
    currentNodes = currentNodes.filter(n => {
      try { return n.context.currentTime < cutoff + maxTime + 1; } catch (e) { return false; }
    });

    return maxTime;
  }

  function stop() {
    stopAll();
    currentTrack = null;
  }

  // === トラックデータ ===
  const n = (name, dur) => ({ n: name, dur: dur || 0.5 });
  const d = (type, dur) => ({ type, dur: dur || 0.5 });

  const TRACKS = {
    // タイトル画面: 壮大なファンファーレ風
    title: {
      bpm: 120,
      melody: [
        n('C4'), n('E4'), n('G4'), n('C5', 1),
        '_', '_',
        n('B4'), n('A4'), n('G4'), n('E4', 1),
        '_', '_',
        n('F4'), n('A4'), n('C5'), n('E5', 1),
        '_', '_',
        n('D5'), n('C5'), n('B4'), n('G4', 1),
        '_', '_',
        n('C4'), n('E4'), n('G4'), n('C5', 1),
        '_', '_',
        n('E5'), n('D5'), n('C5'), n('G4', 1),
        '_', '_',
        n('A4'), n('B4'), n('C5', 1), n('E5', 1),
        n('D5'), n('C5'), n('G4', 1), '_', '_',
      ],
      bass: [
        n('C3', 2), '_', '_', '_', '_', '_',
        n('G3', 2), '_', '_', '_', '_', '_',
        n('F3', 2), '_', '_', '_', '_', '_',
        n('G3', 2), '_', '_', '_', '_', '_',
        n('C3', 2), '_', '_', '_', '_', '_',
        n('E3', 2), '_', '_', '_', '_', '_',
        n('F3', 2), '_', '_', '_', '_',
        n('G3', 2), '_', '_', '_', '_',
      ],
    },

    // 村マップ: のどかで明るい曲
    village: {
      bpm: 130,
      melody: [
        n('E4'), n('G4'), n('A4'), n('B4'),
        n('A4'), n('G4'), n('E4'), n('D4'),
        n('E4'), n('G4'), n('A4'), n('G4'),
        n('E4', 1), '_', '_',
        n('A4'), n('B4'), n('C5'), n('D5'),
        n('C5'), n('B4'), n('A4'), n('G4'),
        n('A4'), n('G4'), n('E4'), n('D4'),
        n('E4', 1), '_', '_',
        n('D4'), n('E4'), n('G4'), n('A4'),
        n('G4'), n('E4'), n('D4'), n('C4'),
        n('D4'), n('E4'), n('G4'), n('E4'),
        n('D4', 1), '_', '_',
        n('E4'), n('G4'), n('A4'), n('B4'),
        n('C5'), n('B4'), n('A4'), n('G4'),
        n('A4'), n('B4'), n('A4'), n('G4'),
        n('E4', 1), '_', '_',
      ],
      bass: [
        n('C3', 1), n('G3', 1), n('C3', 1), n('G3', 1),
        n('A3', 1), n('E3', 1), n('A3', 1), '_',
        n('F3', 1), n('C3', 1), n('F3', 1), n('C3', 1),
        n('G3', 1), n('D3', 1), n('G3', 1), '_',
        n('C3', 1), n('G3', 1), n('C3', 1), n('G3', 1),
        n('A3', 1), n('E3', 1), n('A3', 1), '_',
        n('F3', 1), n('C3', 1), n('G3', 1), n('D3', 1),
        n('C3', 1), '_', '_', '_',
      ],
      drums: [
        d('kick'), d('hat'), d('snare'), d('hat'),
        d('kick'), d('hat'), d('snare'), d('hat'),
        d('kick'), d('hat'), d('snare'), d('hat'),
        d('kick'), d('hat'), d('snare'), d('hat'),
        d('kick'), d('hat'), d('snare'), d('hat'),
        d('kick'), d('hat'), d('snare'), d('hat'),
        d('kick'), d('hat'), d('snare'), d('hat'),
        d('kick'), d('hat'), d('snare'), d('hat'),
        d('kick'), d('hat'), d('snare'), d('hat'),
        d('kick'), d('hat'), d('snare'), d('hat'),
        d('kick'), d('hat'), d('snare'), d('hat'),
        d('kick'), d('hat'), d('snare'), d('hat'),
        d('kick'), d('hat'), d('snare'), d('hat'),
        d('kick'), d('hat'), d('snare'), d('hat'),
        d('kick'), d('hat'), d('snare'), d('hat'),
        d('kick'), d('hat'), d('snare'), d('hat'),
      ],
    },

    // ダンジョン: 緊張感のあるマイナー調
    dungeon: {
      bpm: 110,
      melody: [
        n('E4'), n('Eb4'), n('E4'), n('B3'),
        n('D4'), n('C4'), n('A3', 1),
        '_',
        n('C4'), n('E4'), n('A4'), n('B4'),
        n('Ab4'), n('E4'), n('Ab4'), n('A4', 1),
        '_',
        n('E4'), n('Eb4'), n('E4'), n('B3'),
        n('D4'), n('C4'), n('A3', 1),
        '_',
        n('A3'), n('C4'), n('E4'), n('A4'),
        n('Ab4'), n('E4'), n('C4'), n('A3', 1),
        '_',
      ],
      bass: [
        n('A3', 1), n('E3', 1), n('A3', 1), '_',
        n('F3', 1), n('C3', 1), n('E3', 1), '_',
        n('A3', 1), n('E3', 1), n('A3', 1), '_',
        n('F3', 1), n('E3', 1), n('A3', 1), '_',
      ],
      drums: [
        d('kick'), d('hat'), d('hat'), d('snare'),
        d('hat'), d('kick'), d('hat', 1),
        '_',
        d('kick'), d('hat'), d('hat'), d('snare'),
        d('hat'), d('kick'), d('hat'), d('snare', 1),
        '_',
        d('kick'), d('hat'), d('hat'), d('snare'),
        d('hat'), d('kick'), d('hat', 1),
        '_',
        d('kick'), d('hat'), d('hat'), d('snare'),
        d('hat'), d('kick'), d('hat'), d('snare', 1),
        '_',
      ],
    },

    // 戦闘: テンポの速い激しい曲
    battle: {
      bpm: 170,
      melody: [
        n('A4'), n('C5'), n('A4'), n('E4'),
        n('A4'), n('C5'), n('D5'), n('E5'),
        n('D5'), n('C5'), n('A4'), n('G4'),
        n('A4', 1), '_',
        n('E5'), n('D5'), n('C5'), n('A4'),
        n('G4'), n('A4'), n('C5'), n('D5'),
        n('C5'), n('A4'), n('G4'), n('E4'),
        n('A4', 1), '_',
        n('F4'), n('A4'), n('C5'), n('F5'),
        n('E5'), n('D5'), n('C5'), n('A4'),
        n('G4'), n('A4'), n('B4'), n('C5'),
        n('D5'), n('E5'), n('D5'), n('C5'),
        n('A4'), n('C5'), n('E5', 1),
        n('D5'), n('C5'), n('A4', 1), '_',
      ],
      bass: [
        n('A3', 1), n('E3', 1),
        n('A3', 1), n('E3', 1),
        n('F3', 1), n('C3', 1),
        n('E3', 1), '_',
        n('A3', 1), n('E3', 1),
        n('A3', 1), n('E3', 1),
        n('F3', 1), n('G3', 1),
        n('A3', 1), '_',
        n('F3', 1), n('C3', 1),
        n('D3', 1), n('A3', 1),
        n('E3', 1), n('G3', 1),
        n('A3', 1), '_',
      ],
      drums: [
        d('kick'), d('hat'), d('snare'), d('hat'),
        d('kick'), d('hat'), d('snare'), d('hat'),
        d('kick'), d('hat'), d('snare'), d('hat'),
        d('kick'), d('snare'),
        d('kick'), d('hat'), d('snare'), d('hat'),
        d('kick'), d('hat'), d('snare'), d('hat'),
        d('kick'), d('hat'), d('snare'), d('hat'),
        d('kick'), d('snare'),
        d('kick'), d('hat'), d('snare'), d('hat'),
        d('kick'), d('hat'), d('snare'), d('hat'),
        d('kick'), d('hat'), d('snare'), d('hat'),
        d('kick'), d('hat'), d('snare'), d('hat'),
        d('kick'), d('hat'), d('snare'),
        d('kick'), d('snare'), d('kick'), d('snare'),
      ],
    },

    // ボス戦: さらに激しく重厚
    boss: {
      bpm: 155,
      melody: [
        n('E4'), n('E4'), n('Eb4'), n('E4'),
        n('G4'), n('A4'), n('B4'), n('E5'),
        n('D5'), n('C5'), n('B4'), n('A4'),
        n('Ab4'), n('A4', 1), '_',
        n('C5'), n('B4'), n('A4'), n('Ab4'),
        n('A4'), n('B4'), n('C5'), n('E5'),
        n('Eb5'), n('D5'), n('C5'), n('B4'),
        n('A4', 1), '_', '_',
        n('E5'), n('Eb5'), n('E5'), n('B4'),
        n('D5'), n('C5'), n('A4'), n('E4'),
        n('A4'), n('B4'), n('C5'), n('D5'),
        n('E5', 1), n('D5'), n('C5'),
        n('B4'), n('A4'), n('Ab4'), n('A4', 1),
        '_', '_',
      ],
      bass: [
        n('A3'), n('A3'), n('E3'), n('A3'),
        n('A3'), n('A3'), n('E3'), n('A3'),
        n('F3'), n('F3'), n('C3'), n('F3'),
        n('E3', 1), '_',
        n('A3'), n('A3'), n('E3'), n('A3'),
        n('A3'), n('A3'), n('E3'), n('A3'),
        n('F3'), n('F3'), n('E3'), n('E3'),
        n('A3', 1), '_', '_',
        n('A3'), n('A3'), n('E3'), n('E3'),
        n('F3'), n('F3'), n('E3'), n('E3'),
        n('A3'), n('A3'), n('G3'), n('G3'),
        n('F3', 1), n('E3'), n('E3'),
        n('A3'), n('A3'), n('E3'), n('A3', 1),
        '_', '_',
      ],
      drums: [
        d('kick'), d('kick'), d('snare'), d('hat'),
        d('kick'), d('kick'), d('snare'), d('hat'),
        d('kick'), d('kick'), d('snare'), d('hat'),
        d('kick'), d('snare', 1),
        d('kick'), d('kick'), d('snare'), d('hat'),
        d('kick'), d('kick'), d('snare'), d('hat'),
        d('kick'), d('kick'), d('snare'), d('hat'),
        d('kick'), d('snare'), '_',
        d('kick'), d('kick'), d('snare'), d('hat'),
        d('kick'), d('kick'), d('snare'), d('hat'),
        d('kick'), d('kick'), d('snare'), d('hat'),
        d('kick', 1), d('snare'), d('snare'),
        d('kick'), d('kick'), d('snare'), d('kick', 1),
        '_', '_',
      ],
    },

    // エンディング: 穏やかで感動的
    ending: {
      bpm: 95,
      melody: [
        n('C4', 1), n('E4', 1), n('G4', 1), n('C5', 2),
        '_',
        n('B4', 1), n('A4', 1), n('G4', 2),
        '_',
        n('F4', 1), n('A4', 1), n('C5', 1), n('E5', 2),
        '_',
        n('D5', 1), n('C5', 1), n('B4', 1), n('G4', 2),
        '_',
        n('C5', 1), n('E5', 1), n('G5', 2),
        '_', '_',
        n('F5', 1), n('E5', 1), n('D5', 1), n('C5', 2),
        '_', '_',
      ],
      bass: [
        n('C3', 2), '_', n('G3', 2), '_',
        n('E3', 2), '_', n('G3', 2), '_',
        n('F3', 2), '_', n('A3', 2), '_',
        n('G3', 2), '_', '_', '_', '_',
        n('C3', 2), '_', n('E3', 2),
        '_', '_',
        n('F3', 2), '_', n('G3', 2),
        '_', '_',
      ],
    },
  };

  return { init, unlock, playTrack, stop };
})();
