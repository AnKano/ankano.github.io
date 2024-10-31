import { useState, useEffect } from "react";
import * as Mantine from '@mantine/core';
import { observer } from "mobx-react-lite";
import CoreStore, { Stages } from './stores/core.ts';
import FormStore, { FieldKind, FormFields } from './stores/form.ts';
import BackgroundStore from './stores/background.ts';

import { useElementSize } from "@mantine/hooks";

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
      w={{ base: 400, sm: 800, lg: 1200 }}
      bg='rgba(0, 0, 0, 0.2)' p='2em'
      style={{ borderRadius: '0.5em', border: '1px solid rgba(0, 0, 0, 0.75)' }}>
      <Mantine.FileInput w='100%' style={{ color: 'white' }} value={value} onChange={setValue} label="Source audio file" placeholder='Select audio file' withAsterisk accept=".wav,.mp3" />

      <Mantine.Flex visibleFrom="lg" w='100%' direction='column' gap='md'>
        {Object.entries(FormFields).map(([ffkey, ff], idx) => <Mantine.Flex key={idx} gap='md' align='center'>
          <Mantine.Text w='10em' style={{ color: 'white' }}>{ff.label}</Mantine.Text>
          <Mantine.ButtonGroup>
            {Object.entries(ff.options).map(([_, value], idx) => {
              if (ff.hint)
                return <Mantine.Tooltip key={idx} label={ff.hint}>
                  <Mantine.Button
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

      <Mantine.Flex hiddenFrom="lg" w='100%' direction='column' gap='md'>
        {Object.entries(FormFields).map(([ffkey, ff], idx) => <Mantine.Flex key={idx} gap='md' align='center'>
          <Mantine.NativeSelect w='100%'
            style={{ color: 'white' }}
            label={ff.label}
            disabled={ff.disabled}
            data={Object.entries(ff.options).map(([_, value]) => ({ value: value.id.toString(), label: value.label }))}
            value={FormStore.state[ffkey as FieldKind].id.toString()}
            onChange={(event) => {
              const choice = Object.values(ff.options).find(val => val.id == Number.parseInt(event.target.value));
              FormStore.mutateState({ [ffkey]: choice });
            }}
          />
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

  return <Mantine.Center pos='relative' w='100vw' h='100vh'>
    <Mantine.Flex direction='column' gap='md' bg='rgba(0, 0, 0, 0.2)'
      p='2em' style={{ borderRadius: '0.5em', border: '1px solid rgba(0, 0, 0, 0.75)' }}>
      <Mantine.Flex align='center' gap='md'>
        <Mantine.Loader color='teal' />
        <Mantine.Text style={{ color: 'white' }}>FFmpeg WASM in loading...</Mantine.Text>
      </Mantine.Flex>
    </Mantine.Flex>
  </Mantine.Center>
});

function Background() {
  const { ref, width, height } = useElementSize();

  useEffect(function () {
    if (!ref.current) return;
    BackgroundStore.isntantiate(ref.current);
  }, []);

  useEffect(function () {
    BackgroundStore.resize(width, height);
  }, [width, height]);

  return <Mantine.Box ref={ref} pos='absolute' w='100%' h='100%' style={{ overflow: 'hidden', filter: 'blur(8px) brightness(80%)' }} />;
}
const Application = observer(() => {
  let stage = null;
  if (CoreStore.stage == Stages.Form) {
    stage = <StageForm />
  } else if (CoreStore.stage == Stages.Loading) {
    stage = <StageLoading />
  }

  return <Mantine.Box w='100vw' h='100vh' pos='relative' style={{ overflow: 'hidden' }}>
    <Background />
    <Mantine.Box>
      {stage}
    </Mantine.Box>
  </Mantine.Box>
});

export default Application;