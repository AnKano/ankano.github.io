import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

import { makeAutoObservable } from "mobx";

export enum Stages {
    Loading,
    Form
};

export type FFmpegState = {
    instance: FFmpeg,
    lastLogMessage: string,
    isReady: boolean
    isBusy: boolean
};

export type FFmpegResult = {
    url: string,
    args: string[],
    date: Date
};

class CoreStore {
    private _stage = Stages.Loading;


    private _ffmpegState: FFmpegState = {
        instance: new FFmpeg(),
        lastLogMessage: "",
        isReady: false,
        isBusy: false
    }

    private _results: FFmpegResult[] = [];

    constructor() {
        makeAutoObservable(this)
    }

    public async invokeLoading() {
        const baseURL = "/third-party/ffmpeg/esm";

        this._ffmpegState.instance.on("log", ({ message }) => {
            console.log(message);
            this._ffmpegState.lastLogMessage = message;
        });

        await this._ffmpegState.instance.load({
            coreURL: await toBlobURL(`.${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`.${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });

        this.stage = Stages.Form;
    }

    get stage() {
        return this._stage;
    }

    set stage(value: Stages) {
        this._stage = value;
    }

    get results() {
        return this._results;
    }

    public addResult(url: string, args: string[]) {
        this._results = [{
            url: url,
            args: args,
            date: new Date()
        }, ...this._results];
    }

    get state() {
        return this._ffmpegState;
    }

    get ffmpegInstance() {
        return this._ffmpegState.instance;
    }

    get ffmpegMessage() {
        return this._ffmpegState.lastLogMessage;
    }

    get ffmpegReady() {
        return this._ffmpegState.isReady;
    }

    get ffmpegBusy() {
        return this._ffmpegState.isBusy;
    }

    set ffmpegBusy(value: boolean) {
        this._ffmpegState.isBusy = value;
    }
}

export default new CoreStore();