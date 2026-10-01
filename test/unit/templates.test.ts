import { describe, it, expect } from 'vitest';
import { StateTemplateEngine, STANDARD_TEMPLATE, OBSIDIAN_TEMPLATE } from '../../src/templates/StateTemplateEngine.js';

describe('StateTemplateEngine', () => {
  it('should support Standard (GFM) template states and cycling', () => {
    const engine = new StateTemplateEngine();

    const notStarted = engine.getState(' ');
    expect(notStarted.label).toBe('Not Started');
    expect(notStarted.countsAsCompleted).toBe(false);

    const nextFromNotStarted = engine.getNextState(' ');
    expect(nextFromNotStarted.char).toBe('x');
    expect(nextFromNotStarted.countsAsCompleted).toBe(true);

    const nextFromDone = engine.getNextState('x');
    expect(nextFromDone.char).toBe(' ');
  });

  it('should support Obsidian Tasks multi-state cycling and mappings', () => {
    // Manually test Obsidian template transitions
    const engine = new StateTemplateEngine();
    // Simulate setting template to Obsidian
    (engine as any).currentTemplate = OBSIDIAN_TEMPLATE;
    (engine as any).rebuildIndex();

    expect(engine.getState(' ').label).toBe('Not Started');
    expect(engine.getState('/').label).toBe('In Progress');
    expect(engine.getState('x').label).toBe('Done');
    expect(engine.getState('X').label).toBe('Done');
    expect(engine.getState('-').label).toBe('Cancelled');
    expect(engine.getState('?').label).toBe('Needs Clarification');
    expect(engine.getState('!').label).toBe('Important');

    // Cycle transitions: [ ] -> [/] -> [x] -> [ ]
    expect(engine.getNextState(' ').char).toBe('/');
    expect(engine.getNextState('/').char).toBe('x');
    expect(engine.getNextState('x').char).toBe(' ');

    // Counts as completed
    expect(engine.getState('x').countsAsCompleted).toBe(true);
    expect(engine.getState('/').countsAsCompleted).toBe(false);
    expect(engine.getState('-').countsAsCompleted).toBe(false);
    expect(engine.getState('!').countsAsCompleted).toBe(false);

    // Strikethrough
    expect(engine.getState('x').strikethrough).toBe(true);
    expect(engine.getState('-').strikethrough).toBe(true);
    expect(engine.getState('/').strikethrough).toBe(false);
  });

  it('should provide graceful fallback for unmapped bracket characters', () => {
    const engine = new StateTemplateEngine();
    const unknown = engine.getState('>');

    expect(unknown.id).toBe('unknown');
    expect(unknown.icon).toBe('circle-small-filled');
    expect(unknown.countsAsCompleted).toBe(false);
    expect(unknown.strikethrough).toBe(false);
  });
});
