import { NextResponse } from "next/server";

type ApiResponse<T> = {
  data?: T;
  error?: string;
  meta?: Record<string, unknown>;
};

export function ok<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json<ApiResponse<T>>({ data, meta });
}

export function err(message: string, status = 400) {
  return NextResponse.json<ApiResponse<never>>({ error: message }, { status });
}

export function notFound(resource = "Resource") {
  return err(`${resource} not found`, 404);
}

export function unauthorized() {
  return err("Unauthorized", 401);
}
