/**
 * Mocks the HTMLImageElement class for testing. Useful for when needing to test specific eventListeners of the image.
 */
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

  /**
   * Overrides HTMLImageElement addEventListener method. Supports 'load', 'error', and 'abort' events.
   * Saves the type's listener method if supported.
   * @param type the event type
   * @param listener a listener method to save
   */
  addEventListener(type: keyof GlobalEventHandlersEventMap, listener: () => void): void {
    if (type === 'load') {
      this.loadFn = listener;
    } else if (type === 'error') {
      this.errorFn = listener;
    } else if (type === 'abort') {
      this.abortFn = listener;
    }
  }

  /**
   * Overrides HTMLImageElement removeEventListener method. Supports 'load', 'error', and 'abort' events.
   * Removes the type's listener method if supported.
   * @param type the event type
   * @param listener unused
   */
  removeEventListener(type: keyof GlobalEventHandlersEventMap, _: () => void): void {
    if (type === 'load') {
      this.loadFn = null;
    } else if (type === 'error') {
      this.errorFn = null;
    } else if (type === 'abort') {
      this.abortFn = null;
    }
  }

  /**
   * Calls the saved onLoad listener method. Set the timeout so in fakeAsync the tick method can be called to then call the listener.
   * Does not null check the load listener to help with unit test debugging.
   * @param timeout the amount of time to pass before calling the load listener
   */
  onLoad(timeout: number): void {
    setTimeout(() => {
      this.loadFn();
    }, timeout);
  }

  /**
   * Calls the saved onError listener method. Set the timeout so in fakeAsync the tick method can be called to then call the listener.
   * Does not null check the load listener to help with unit test debugging.
   * @param timeout the amount of time to pass before calling the error listener
   */
  onError(timeout: number): void {
    setTimeout(() => {
      this.errorFn();
    }, timeout);
  }

  /**
   * Calls the saved onAbort listener method. Set the timeout so in fakeAsync the tick method can be called to then call the listener.
   * Does not null check the load listener to help with unit test debugging.
   * @param timeout the amount of time to pass before calling the abort listener
   */
  onAbort(timeout: number): void {
    setTimeout(() => {
      this.abortFn();
    }, timeout);
  }
}
