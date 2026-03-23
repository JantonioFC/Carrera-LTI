export interface TimeProvider {
  now(): number;
  isoString(): string;
}

export class MockTimeProvider implements TimeProvider {
  constructor(private fixedTime: number) {}
  now(): number { return this.fixedTime; }
  isoString(): string { return new Date(this.fixedTime).toISOString(); }
}
