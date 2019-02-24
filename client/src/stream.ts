function promiseLoad(reader: FileReader): Promise<any> {
  return new Promise((resolve, reject) => {
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.onerror = () => {
      reject(reader.error);
    };
  });
}

function readAsString(reader: FileReader, blob: Blob): Promise<string> {
  reader.readAsText(blob);
  return promiseLoad(reader);
}

function readAsArrayBuffer(
  reader: FileReader,
  blob: Blob,
): Promise<ArrayBuffer> {
  reader.readAsArrayBuffer(blob);
  return promiseLoad(reader);
}

interface ReadableStreamFromBlobInit {
  chunkSize?: number;
  offset?: number;
}

function createStreamFromBlob(
  blob: Blob,
  { chunkSize = 1024, offset = 0 }: ReadableStreamFromBlobInit = {},
  read: (reader: FileReader, slice: Blob) => Promise<any>,
): ReadableStream<any> {
  const reader = new FileReader();

  return new ReadableStream({
    // start(controller) {
    //   this.reader = new FileReader();
    // },
    async pull(controller) {
      if (offset >= blob.size) return controller.close();

      const end = offset + chunkSize;
      const slice = blob.slice(offset, end);

      const buffer = await read(reader, slice);
      controller.enqueue(buffer);

      offset = end;
    },
    cancel() {
      reader.abort();
    },
  });
}

export function createUint8ArrayStreamFromBlob(
  blob: Blob,
  init?: ReadableStreamFromBlobInit,
): ReadableStream<ArrayBuffer> {
  return createStreamFromBlob(blob, init, async (...params) => {
    return new Uint8Array(await readAsArrayBuffer(...params));
  });
}

export function createArrayBufferStreamFromBlob(
  blob: Blob,
  init?: ReadableStreamFromBlobInit,
): ReadableStream<ArrayBuffer> {
  return createStreamFromBlob(blob, init, readAsArrayBuffer);
}

export function createStringStreamFromBlob(
  blob: Blob,
  init?: ReadableStreamFromBlobInit,
): ReadableStream<string> {
  return createStreamFromBlob(blob, init, readAsString);
}

export function createAsyncIteratorFromStream(
  stream: ReadableStream,
): AsyncIterableIterator<any> {
  const reader = stream.getReader();
  return {
    next() {
      return reader.read();
    },
    async return() {
      reader.releaseLock();
      // Per specification value can be ommitted if done = true
      // TypeScript requires value in IteratorResult
      // See https://github.com/Microsoft/TypeScript/issues/8938
      return { done: true, value: undefined };
    },
    [Symbol.asyncIterator]() {
      return this;
    },
  };
}
// or
// export async function* createAsyncIteratorFromStream(
//   stream: ReadableStream,
// ): AsyncIterableIterator<any> {
//   const reader = stream.getReader();
//   try {
//     while (true) {
//       const { done, value } = await reader.read();
//       if (done) return;
//       yield value;
//     }
//   } finally {
//     reader.releaseLock();
//   }
// }
