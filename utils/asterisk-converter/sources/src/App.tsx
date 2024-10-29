import { useState, useEffect, useRef } from "react";
import * as Mantine from '@mantine/core';
import { observer } from "mobx-react-lite";
import CoreStore, { Stages } from './stores/core.ts';
import FormStore, { FieldKind, FormFields } from './stores/form.ts';

import { Application as PixiApp, Graphics, BlurFilter } from 'pixi.js';
import * as lodash from 'lodash';
import chroma from "chroma-js";

const StageForm = observer(() => {
  const [value, setValue] = useState<File | null>(null);

  async function processFile() {
    if (!value) return;
    const inputData = await value.arrayBuffer();

    CoreStore.ffmpegBusy = true;

    const ffmpeg = CoreStore.ffmpegInstance;
    await ffmpeg.writeFile(value.name, new Uint8Array(inputData));

    const argsCollector = [];
    // input
    argsCollector.push(["-i", value.name]);
    // modifiers
    Object.entries(FormFields).forEach(([key]) => {
      argsCollector.push(FormStore.state[key as FieldKind].args);
    });
    // output 
    argsCollector.push(["output.wav"]);

    await ffmpeg.exec(argsCollector.flat());

    const fileData = await ffmpeg.readFile('output.wav');
    const data = new Uint8Array(fileData as ArrayBuffer);

    CoreStore.addResult(
      URL.createObjectURL(new Blob([data.buffer], { type: 'audio/wav' })),
      argsCollector.flat()
    );

    CoreStore.ffmpegBusy = false;
  }

  return <Mantine.Center w='100vw' h='100vh' pos='relative'>
    <Mantine.Flex direction='column' align='center' gap='md'
      bg='rgba(0, 0, 0, 0.2)'
      py='4em' px='8em'
      style={{ borderRadius: '0.5em', border: '1px solid rgba(0, 0, 0, 0.75)' }}>
      <Mantine.FileInput w='100%' style={{ color: 'white' }} value={value} onChange={setValue} label="Source audio file" placeholder='Select audio file' withAsterisk accept=".wav,.mp3" />

      <Mantine.Flex w='100%' direction='column' gap='md'>
        {Object.entries(FormFields).map(([ffkey, ff], idx) => <Mantine.Flex key={idx} gap='md' align='center'>
          <Mantine.Text w='10em' style={{ color: 'white' }}>{ff.label}</Mantine.Text>
          <Mantine.ButtonGroup>
            {Object.entries(ff.options).map(([_, value], idx) => {
              if (ff.hint)
                return <Mantine.Tooltip label={ff.hint}>
                  <Mantine.Button key={idx}
                    disabled={ff.disabled}
                    color='teal'
                    variant={FormStore.state[ffkey as FieldKind].id == value.id ? 'filled' : 'default'}
                    onClick={() => FormStore.mutateState({ [ffkey]: value })}>
                    {value.label}
                  </Mantine.Button>
                </Mantine.Tooltip>
              return <Mantine.Button key={idx}
                disabled={ff.disabled}
                color='teal'
                variant={FormStore.state[ffkey as FieldKind].id == value.id ? 'filled' : 'default'}
                onClick={() => FormStore.mutateState({ [ffkey]: value })}>
                {value.label}
              </Mantine.Button>
            })}
          </Mantine.ButtonGroup>
        </Mantine.Flex>)}
      </Mantine.Flex>

      <Mantine.Flex w='100%' gap='md' justify='center'>
        <Mantine.Button variant="gradient" gradient={{ from: 'red', to: 'orange', deg: 90 }}
          onClick={() => FormStore.mutateState({
            "audio-channels": FormFields["audio-channels"].options["mono"],
            "audio-frequency": FormFields["audio-frequency"].options["af8"],
            "pcm-format": FormFields["pcm-format"].options["pcm-s16le"],
            "output-format": FormFields["output-format"].options["of-wav"],
          })}>
          Asterisk Defaults
        </Mantine.Button>
        <Mantine.Button color='teal' onClick={processFile} disabled={!value || CoreStore.ffmpegBusy} loading={CoreStore.ffmpegBusy}>Process selected file</Mantine.Button>
      </Mantine.Flex>

      <Mantine.ScrollArea w='100%' h='250' type='always' style={{ borderRadius: '0.5em', border: '1px solid rgba(0, 0, 0, 0.64)', overflow: 'hidden', backgroundColor: '#edf2f7' }}>
        {CoreStore.results.length == 0
          ? <Mantine.Center w='100%' h='240'>
            <Mantine.Text>No processed audio files</Mantine.Text>
          </Mantine.Center>
          : <Mantine.Flex direction='column'>
            {CoreStore.results.map((res, idx) => <Mantine.Flex key={idx} direction='column' style={{ padding: '1em', borderBottom: '1px solid rgba(0, 0, 0, 0.64)' }}>
              <audio src={res.url} controls style={{ width: '100%' }} />
              <Mantine.Text w='100%' style={{ textAlign: 'center' }}>{'FFmpeg arguements: ' + res.args.join(' ')}</Mantine.Text>
            </Mantine.Flex>)}
          </Mantine.Flex>}
      </Mantine.ScrollArea>
    </Mantine.Flex>
  </Mantine.Center >
});

const StageLoading = observer(() => {
  useEffect(function () {
    CoreStore.invokeLoading();
  }, []);

  return <Mantine.Center w='100vw' h='100vh' pos='relative' >
    <Mantine.Flex direction='column' gap='md'
      bg='rgba(0, 0, 0, 0.2)'
      py='4em' px='8em'
      style={{ borderRadius: '0.5em', border: '1px solid rgba(0, 0, 0, 0.75)' }}>
      <Mantine.Flex align='center' gap='md'>
        <Mantine.Loader color='teal' />
        <Mantine.Text style={{ color: 'white' }}>FFmpeg WASM in loading...</Mantine.Text>
      </Mantine.Flex>
    </Mantine.Flex>
  </Mantine.Center>
});

function randomElement(array: any[]) {
  return array[Math.floor(Math.random() * array.length)]
}

async function startApplication(mountPoint: HTMLDivElement) {
  const app = new PixiApp();

  const filter = new BlurFilter();

  // Initialize the application
  await app.init({ background: '#f7fafc', resizeTo: mountPoint, antialias: true });

  // Append the application canvas to the document body
  mountPoint.appendChild(app.canvas);

  const circles = lodash.range(0, 100).map(function () {
    const graphics = new Graphics();
    graphics.circle(100, 250, 50 * Math.random());
    graphics.fill({
      color: chroma(randomElement(['#14b8a6', '#f97316']))
        .hex()
    });
    graphics.x = Math.random() * app.screen.width;
    graphics.y = Math.random() * app.screen.height;

    graphics.filters = [filter];

    return {
      graphics: graphics,
      speed: Math.random() * 2,
      horizontalSpeed: (Math.random() - 1) * 2.0
    };
  });

  circles.forEach(function (bunny) {
    app.stage.addChild(bunny.graphics);
  });

  // Listen for animate update
  app.ticker.add((time) => {
    circles.forEach((circle) => {
      if (circle.graphics.y < -300)
        circle.graphics.y = app.screen.height;
      if (circle.graphics.x < -200 || circle.graphics.x > app.screen.width + 200) {
        circle.graphics.x = Math.random() * app.screen.width;
        circle.graphics.y = app.screen.height;
      }

      circle.graphics.y -= time.deltaTime * circle.speed;
      circle.graphics.x += circle.horizontalSpeed * Math.random() * time.deltaTime;
    });
  });
}

function Background() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(function () {
    if (!containerRef.current) return;
    startApplication(containerRef.current);
  }, []);

  return <Mantine.Box ref={containerRef} pos='absolute' bottom='0' top='0' right='0' left='0' style={{ overflow: 'hidden', filter: 'brightness(80%)' }} />;
}

const Application = observer(() => {
  let stage = null;
  if (CoreStore.stage == Stages.Form) {
    stage = <StageForm />
  } else if (CoreStore.stage == Stages.Loading) {
    stage = <StageLoading />
  }

  return <Mantine.Box w='100vw' h='100vh' pos='relative'>
    <Background />
    {stage}
  </Mantine.Box>
});

export default Application;