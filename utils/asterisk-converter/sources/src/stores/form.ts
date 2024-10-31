
import { makeAutoObservable } from "mobx";


export type Option = {
    id: number,
    label: string,
    args: string[]
};

export type FieldOptions = Record<string, Option>;

export type FieldKind = "audio-frequency" | "audio-channels" | "pcm-format" | "output-format";

export type Field = {
    label: string,
    measurement?: string,
    disabled?: boolean,
    hint?: string,
    options: FieldOptions
}

export const FormFields: Record<FieldKind, Field> = {
    'audio-frequency': {
        label: 'Audio frequency',
        measurement: 'Hz',
        options: {
            'af8': { id: 1, label: '8000', args: ['-ar', '8000'] },
            'af11': { id: 2, label: '11025', args: ['-ar', '11025'] },
            'af16': { id: 3, label: '16000', args: ['-ar', '16000'] },
            'af22': { id: 4, label: '22050', args: ['-ar', '22050'] },
            'af24': { id: 5, label: '24000', args: ['-ar', '24000'] },
            'af32': { id: 6, label: '32000', args: ['-ar', '32000'] },
            'af44': { id: 7, label: '44100', args: ['-ar', '44100'] },
            'af48': { id: 8, label: '48000', args: ['-ar', '48000'] },
            'af96': { id: 9, label: '96000', args: ['-ar', '96000'] }
        }
    },
    'audio-channels': {
        label: 'Audio channels',
        options: {
            'mono': { id: 1, label: 'Mono', args: ['-ac', '1'] },
            'stereo': { id: 2, label: 'Stereo', args: ['-ac', '2'] },
        }
    },
    'pcm-format': {
        label: 'PCM Format',
        options: {
            'pcm-u8': { id: 1, label: 'U8', args: ['-acodec', 'pcm_u8'] },
            'pcm-s16le': { id: 2, label: 'S16LE', args: ['-acodec', 'pcm_s16le'] },
            'pcm-s24le': { id: 3, label: 'S24LE', args: ['-acodec', 'pcm_s24le'] },
            'pcm-s32le': { id: 4, label: 'S32LE', args: ['-acodec', 'pcm_s32le'] },
            'pcm-f32le': { id: 5, label: 'F32LE', args: ['-acodec', 'pcm_f32le'] },
            'pcm-f64le': { id: 6, label: 'F64LE', args: ['-acodec', 'pcm_f64le'] },
        }
    },
    'output-format': {
        label: 'Output Format',
        disabled: true,
        hint: 'Asterisk don\'t support playback of files that differ from Waveform by default',
        options: {
            'of-wav': { id: 1, label: 'Waveform Audio File', args: [] }
        }
    }
}

class FormStore {
    private _state: Record<FieldKind, Option> = {
        "audio-channels": FormFields["audio-channels"].options["mono"],
        "audio-frequency": FormFields["audio-frequency"].options["af8"],
        "pcm-format": FormFields["pcm-format"].options["pcm-s16le"],
        "output-format": FormFields["output-format"].options["of-wav"],
    };

    constructor() {
        makeAutoObservable(this)
    }

    public mutateState(value: Partial<Record<FieldKind, Option>>) {
        this._state = {
            ...this._state,
            ...value
        }
    }

    get state() {
        return this._state;
    }
}

export default new FormStore();