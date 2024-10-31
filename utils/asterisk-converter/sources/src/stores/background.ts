import * as THREE from 'three';

import { makeAutoObservable } from "mobx";

type CircleState = {
    matrix: THREE.Matrix4
    position: THREE.Vector3
    quaternion: THREE.Quaternion
    scale: THREE.Vector3

    color: string;

    verticalSpeed: number,
    horizontalSpeed: number
}

class BackgroundWebGLAppilication {
    prevFrameDateTime: number;
    renderer: THREE.WebGLRenderer;

    camera: THREE.OrthographicCamera;
    scene: THREE.Scene;

    instancedMeshes: THREE.InstancedMesh;
    circleStates: CircleState[] = [];

    width: number = 100;
    height: number = 100;
    frustumSize: number = 100;

    randomElement(array: any[]) {
        return array[Math.floor(Math.random() * array.length)]
    }

    getRandomState(state: CircleState) {
        state.position.x = Math.random() * 100 - 50;
        state.position.y = Math.random() * 100 - 50;
        state.position.z = -15;

        state.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);

        state.scale.x = state.scale.y = state.scale.z = Math.random() * 5;
        // state.scale.x = state.scale.y = state.scale.z = 1;

        state.matrix = (new THREE.Matrix4()).compose(state.position, state.quaternion, state.scale);
    };

    updateState(state: CircleState, deltaTime: number) {

        if (state.position.y > 80) {
            state.position.x = Math.random() * 100 - 80;
            state.position.y = -80;
        }

        if (state.position.x <= -80 || state.position.x >= 80) {
            state.position.x = Math.random() * 100 - 80;
            state.position.y = -80;
        }

        state.position.y += state.verticalSpeed * deltaTime;
        state.position.x += state.horizontalSpeed * deltaTime;

        state.matrix = (new THREE.Matrix4()).compose(state.position, state.quaternion, state.scale);
    }

    constructor(container: HTMLDivElement) {
        this.renderer = new THREE.WebGLRenderer();

        container.appendChild(this.renderer.domElement);

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xFFFFFF);

        const aspect = this.width / this.height;
        this.camera = new THREE.OrthographicCamera(
            this.frustumSize * aspect / - 2,
            this.frustumSize * aspect / 2,
            this.frustumSize / 2,
            this.frustumSize / - 2,
            0.1, 100
        );;

        const geometry = new THREE.CylinderGeometry(1, 1, 1, 32);
        const material = new THREE.MeshBasicMaterial({ color: '#FFFFFF' });

        this.instancedMeshes = new THREE.InstancedMesh(geometry, material, 100);
        for (let i = 0; i < 100; i++) {
            const state: CircleState = {
                matrix: new THREE.Matrix4(),
                position: new THREE.Vector3(),
                scale: new THREE.Vector3(),
                quaternion: new THREE.Quaternion(),

                color: this.randomElement(['#14b8a6', '#f97316']),

                verticalSpeed: Math.random() * 10,
                horizontalSpeed: (Math.random() - 0.5) * 20
            }

            this.getRandomState(state);
            this.circleStates.push(state);

            this.instancedMeshes.setMatrixAt(i, state.matrix);
            this.instancedMeshes.setColorAt(i, new THREE.Color(this.circleStates[i].color));
        }

        this.scene.add(this.instancedMeshes);
        this.prevFrameDateTime = Date.now() * 0.001;
        this.renderer.setAnimationLoop(this.render.bind(this));
    }

    private render() {
        const deltaTime = Date.now() * 0.001 - this.prevFrameDateTime;
        this.prevFrameDateTime = Date.now() * 0.001;

        for (let i = 0; i < 100; i++) {
            this.updateState(this.circleStates[i], deltaTime);
            this.instancedMeshes.setMatrixAt(i, this.circleStates[i].matrix);
        }
        this.instancedMeshes.instanceMatrix.needsUpdate = true;

        this.renderer.render(this.scene, this.camera);
    }

    public resize(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.renderer.setSize(this.width, this.height);

        const aspect = this.width / this.height;
        
        this.camera = new THREE.OrthographicCamera(
            this.frustumSize * aspect / - 2,
            this.frustumSize * aspect / 2,
            this.frustumSize / 2,
            this.frustumSize / - 2,
            0.1, 100
        );
    }
}

class BackgroundStore {
    private instance: BackgroundWebGLAppilication | null = null;

    constructor() {
        makeAutoObservable(this)
    }

    public isntantiate(conatiner: HTMLDivElement) {
        if (this.instance) return;
        this.instance = new BackgroundWebGLAppilication(conatiner);
    }

    public resize(width: number, height: number) {
        this.instance?.resize(width, height)
    }
}

export default new BackgroundStore();