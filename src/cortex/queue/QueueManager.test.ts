import { describe, it, expect, beforeEach } from 'vitest';
import { Volume } from 'memfs';
import { QueueManager, QueueOperation } from './QueueManager';

function makeOp(id: string, type = 'index_document'): QueueOperation {
  return { id, type, payload: { path: `/docs/${id}.pdf` }, enqueuedAt: Date.now() };
}

describe('QueueManager — enqueue / dequeue (FIFO)', () => {
  let queue: QueueManager;

  beforeEach(() => {
    const vol = new Volume();
    queue = new QueueManager({ fs: vol as never, queuePath: '/queue.json' });
  });

  it('should_enqueue_and_dequeue_single_operation', () => {
    const op = makeOp('op-1');
    queue.enqueue(op);
    expect(queue.dequeue()).toEqual(op);
  });

  it('should_respect_fifo_order', () => {
    queue.enqueue(makeOp('op-1'));
    queue.enqueue(makeOp('op-2'));
    queue.enqueue(makeOp('op-3'));
    expect(queue.dequeue()?.id).toBe('op-1');
    expect(queue.dequeue()?.id).toBe('op-2');
    expect(queue.dequeue()?.id).toBe('op-3');
  });

  it('should_return_null_when_queue_is_empty', () => {
    expect(queue.dequeue()).toBeNull();
  });

  it('should_report_correct_size', () => {
    expect(queue.size()).toBe(0);
    queue.enqueue(makeOp('op-1'));
    queue.enqueue(makeOp('op-2'));
    expect(queue.size()).toBe(2);
    queue.dequeue();
    expect(queue.size()).toBe(1);
  });

  it('should_not_enqueue_duplicate_id', () => {
    queue.enqueue(makeOp('op-1'));
    queue.enqueue(makeOp('op-1')); // duplicado
    expect(queue.size()).toBe(1);
  });
});

describe('QueueManager — persistQueue / restoreQueue', () => {
  it('should_persist_and_restore_queue_from_filesystem', () => {
    const vol = new Volume();
    const q1 = new QueueManager({ fs: vol as never, queuePath: '/queue.json' });
    q1.enqueue(makeOp('op-A'));
    q1.enqueue(makeOp('op-B'));
    q1.persistQueue();

    // Nueva instancia leyendo el mismo volumen
    const q2 = new QueueManager({ fs: vol as never, queuePath: '/queue.json' });
    q2.restoreQueue();
    expect(q2.size()).toBe(2);
    expect(q2.dequeue()?.id).toBe('op-A');
  });

  it('should_start_empty_if_queue_file_does_not_exist', () => {
    const vol = new Volume();
    const q = new QueueManager({ fs: vol as never, queuePath: '/nonexistent.json' });
    q.restoreQueue();
    expect(q.size()).toBe(0);
  });

  it('should_overwrite_queue_file_on_persist', () => {
    const vol = new Volume();
    const q = new QueueManager({ fs: vol as never, queuePath: '/queue.json' });
    q.enqueue(makeOp('op-1'));
    q.persistQueue();
    q.dequeue();
    q.persistQueue(); // ahora vacía

    const q2 = new QueueManager({ fs: vol as never, queuePath: '/queue.json' });
    q2.restoreQueue();
    expect(q2.size()).toBe(0);
  });
});
