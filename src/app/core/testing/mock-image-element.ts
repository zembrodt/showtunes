export class MockImageElement {
  crossOrigin: string = null;
  src: string = null;
  width: number = null;
  height: number = null;

  private loadFn: () => void = null;
  private errorFn: () => void = null;
  private abortFn: () => void = null;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  addEventListener(type: keyof GlobalEventHandlersEventMap, listener: () => void): void {
    if (type === 'load') {
      this.loadFn = listener;
    } else if (type === 'error') {
      this.errorFn = listener;
    } else if (type === 'abort') {
      this.abortFn = listener;
    }
  }

  removeEventListener(type: keyof GlobalEventHandlersEventMap, _: () => void): void {
    if (type === 'load') {
      this.loadFn = null;
    } else if (type === 'error') {
      this.errorFn = null;
    } else if (type === 'abort') {
      this.abortFn = null;
    }
  }

  onLoad(timeout: number): void {
    setTimeout(() => {
      this.loadFn();
    }, timeout);
  }

  onError(timeout: number): void {
    setTimeout(() => {
      this.errorFn();
    }, timeout);
  }

  onAbort(timeout: number): void {
    setTimeout(() => {
      this.abortFn();
    }, timeout);
  }
}
