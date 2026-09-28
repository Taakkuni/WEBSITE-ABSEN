import { Employee } from '@/types';

/**
 * Calculates Euclidean distance between two 128-dimensional face embedding vectors.
 */
export function euclideanDistance(arr1: number[], arr2: number[]): number {
  if (arr1.length !== arr2.length) {
    return Infinity;
  }
  let sum = 0;
  for (let i = 0; i < arr1.length; i++) {
    const diff = arr1[i] - arr2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * Converts distance into a 0 - 100% confidence percentage.
 * Typical face-api.js distance ranges from 0.2 (identical) to 0.7+ (different person).
 */
export function distanceToConfidence(distance: number): number {
  // If distance is 0 -> 100%
  // If distance is 0.6 (threshold) -> ~60%
  // If distance >= 1.0 -> 0%
  const confidence = Math.max(0, Math.min(100, Math.round((1 - distance * 0.8) * 100)));
  return confidence;
}

/**
 * Matches a target face embedding against all active employees with registered face descriptors.
 */
export function findBestMatch(
  queryDescriptor: number[],
  employees: Employee[],
  threshold: number = 0.55
): {
  employee: Employee | null;
  distance: number;
  confidence: number;
  isMatch: boolean;
} {
  let bestMatch: Employee | null = null;
  let minDistance = Infinity;

  for (const emp of employees) {
    if (!emp.is_active || !emp.face_embedding || emp.face_embedding.length === 0) {
      continue;
    }

    const dist = euclideanDistance(queryDescriptor, emp.face_embedding);
    if (dist < minDistance) {
      minDistance = dist;
      bestMatch = emp;
    }
  }

  const isMatch = bestMatch !== null && minDistance <= threshold;
  const confidence = isMatch ? distanceToConfidence(minDistance) : 0;

  return {
    employee: isMatch ? bestMatch : null,
    distance: minDistance,
    confidence,
    isMatch,
  };
}
