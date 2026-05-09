export type JsonEvent<T> = {
  event: string;
  data: T;
};

export type EventHandlers<T> = {
  onEvent: (event: JsonEvent<T>) => void;
  onError?: () => void;
};

export function openJsonEventSource<T>(url: string, handlers: EventHandlers<T>): EventSource {
  const source = new EventSource(url);

  source.addEventListener('job', (event) => {
    handlers.onEvent({ event: 'job', data: JSON.parse((event as MessageEvent).data) as T });
  });

  source.addEventListener('jobs', (event) => {
    handlers.onEvent({ event: 'jobs', data: JSON.parse((event as MessageEvent).data) as T });
  });

  source.onerror = () => {
    handlers.onError?.();
  };

  return source;
}

