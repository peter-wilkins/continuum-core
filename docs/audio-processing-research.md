# Audio Processing Research

Continuum's audio path should capture what transcription loses: tone, prosody, intent, speech rhythm, speaker changes, and uncertainty. Capture remains platform-owned; shared processing starts from explicit Audio Artifact references.

## Library And Provider Prior Art

- OpenAI speech-to-text: strong first hosted transcription provider with request and streaming transcription paths. Source: https://developers.openai.com/api/docs/guides/speech-to-text
- whisper.cpp: local/offline transcription engine with Linux, Android, iOS, WebAssembly, and other platform support. Source: https://github.com/ggml-org/whisper.cpp
- Deepgram and AssemblyAI: useful reference designs for transcript-plus-intelligence APIs such as summaries, topics, intents, and sentiment. Sources: https://developers.deepgram.com/docs/audio-intelligence and https://assembly-preview.mintlify.app/docs/audio-intelligence/sentiment-analysis
- Meyda: JavaScript audio feature extraction for browser and Node. Useful for cheap local signal features, not enough for trustworthy emotion detection alone. Source: https://meyda.js.org/getting-started
- Transformers.js: TypeScript-friendly local/browser model runtime for ASR, audio classification, and text classification when ONNX models are practical. Source: https://huggingface.co/docs/transformers.js/main/index
- openSMILE: established speech and audio feature extraction toolkit, especially for emotion-recognition features. Source: https://audeering.github.io/opensmile/
- pyannote.audio: Python-first diarization and speaker segmentation toolkit. Source: https://github.com/pyannote/pyannote-audio
- Vosk: offline speech recognition with Node, Python, Android, iOS, and server bindings. Source: https://github.com/alphacep/vosk-api

## Public Labelled Speech Dataset Candidates

Use these as benchmark candidates before training anything. Prefer direct upstream datasets over mirrors. Keep licence, consent, label scheme, and source provenance with every imported sample.

| Dataset | Best For | Labels | Licence / Friction | Notes |
| --- | --- | --- | --- | --- |
| CREMA-D | First emotion benchmark | Emotion category, intensity, agreement, actor metadata | ODbL, commercial use listed by audEERING | 7,441 audio clips, English, 91 actors. Good first candidate because labels and splits are easy to inspect. Source: https://audeering.github.io/datasets/datasets/crema-d.html |
| Emozionalmente | Commercial-friendly emotion benchmark | Big Six emotions plus neutral, actor/rater demographics, train/dev/test split | CC BY 4.0 | Italian, 6,902 samples, 431 amateur actors. Good for cross-language sanity checks. Source: https://www.openslr.org/161/ |
| MSP-Podcast | Naturalistic emotion benchmark | Crowdsourced emotional annotations over podcast speech turns | Access process and licence need review before product use | Large naturalistic corpus, version 2.0 has 264,705 speaking turns and 409 hours. Source: https://www.lab-msp.com/MSP/MSP-Podcast.html |
| RAVDESS | Classic acted emotion baseline | Emotion, intensity, modality, actor | CC BY-NC-SA 4.0 unless commercial licence purchased | Useful, but non-commercial by default. Source: https://smartlaboratory.org/resources/speech-song-database-ravdess/ |
| CMU-MOSEI | Multimodal sentiment and emotion | Sentiment and emotion intensity over YouTube monologues | CC-BY-NC-4.0 in audEERING dataset card | Good for audio plus text/video research, but YouTube provenance/licence needs care. Source: https://audeering.github.io/datasets/datasets/cmu-mosei.html |
| SLURP | Spoken intent and slot understanding | Scenario, action, intent, entities, recordings, ASR error metadata | Audio is CC BY-NC 4.0 per project README | Better for "what is the user trying to do" than tone. Source: https://github.com/pswietojanski/slurp |
| Fluent Speech Commands | Spoken command intent | Action, object, location, transcript, speaker split | Original Fluent page says academic research only; Zenodo mirror says CC BY 4.0, so treat as licence-conflicted until verified | Useful SLU baseline, but do not use for product training until licence is clarified. Sources: https://fluent.ai/fr/fluent-speech-commands-a-dataset-for-spoken-language-understanding-research/ and https://zenodo.org/records/11106540 |
| Switchboard Dialog Act Corpus | Conversational function | Speech act/dialog act tags over telephone conversations | Corpus access/licence depends on source distribution | Good for intent-like conversation moves: question, answer, backchannel, agreement. Source: https://convokit.cornell.edu/documentation/switchboard.html |
| TonalityPrint v1 | Functional tonal intent | Trust, attention, reciprocity, empathy resonance, cognitive energy, ambivalence | CC BY-NC 4.0, single speaker, very small | Very aligned with Continuum's interest in tone, but hypothesis-generating only. Source: https://huggingface.co/datasets/tonalityprint/tonalityprint-v1 |
| Trustworthy Intent Dataset | Trustworthiness intent | Neutral vs trustworthy intent, demographics, acoustic features | Open-access paper; data licence still needs direct download verification | Highly relevant to "what tone is doing", not just emotion. Source: https://www.nature.com/articles/s41597-025-05267-3 |
| IEMOCAP | Research-standard emotion and dimensional affect | Emotion categories, valence, activation/arousal, dominance | Access request/licence friction | Strong benchmark but not frictionless. Source: https://sail.usc.edu/iemocap/iemocap_info.htm |
| Speech Commands | Keyword/command spotting | Single spoken word class | CC BY 4.0 docs | Not tone-rich, but useful for tiny audio pipeline tests and command classifiers. Source: https://www.tensorflow.org/datasets/catalog/speech_commands |

## Recommendation

First benchmark pack:

1. CREMA-D for acted emotion and intensity.
2. Emozionalmente for permissive cross-language emotion.
3. Speech Commands for tiny pipeline tests.
4. TonalityPrint as a small "functional tone" probe, research only.
5. SLURP for spoken intent, research only.

Do not train product models on non-commercial or licence-conflicted datasets. They can still shape schemas, local experiments, and QA if clearly marked.

## Processor Shape

The audio processing contract should support:

- transcription processors producing Raw Transcript Text and timed segments
- feature processors producing acoustic/prosodic feature vectors
- tone processors producing uncertain tone hypotheses
- intent processors producing spoken intent hypotheses
- benchmark adapters mapping public dataset labels into the same observation shape

Every processor output should be rebuildable from the Audio Artifact plus processor configuration.
