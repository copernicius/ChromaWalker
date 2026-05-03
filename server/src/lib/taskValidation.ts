// Task constraint validation. v1 only handles `color` — future constraints
// (time window, location radius, quantity) drop in here as additional
// checks on the same Task shape.
//
// A task is anything with constraints to satisfy: catalog missions
// (DAILY_MISSIONS, SOLO_MISSIONS) and user-created TeamMissions all conform
// once you read off their color field.

export interface Task {
  color: string; // palette id, or 'rainbow' for "any color counts"
}

export type ConstraintFailure = 'color';

export interface ValidationResult {
  ok: boolean;
  failures: ConstraintFailure[];
}

export function validateContribution(task: Task, photoColor: string): ValidationResult {
  const failures: ConstraintFailure[] = [];

  // Color: 'rainbow' means any color qualifies; otherwise exact match.
  if (task.color !== 'rainbow' && task.color !== photoColor) {
    failures.push('color');
  }

  return { ok: failures.length === 0, failures };
}
