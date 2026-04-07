# React + TS Project Rules

## Core Tech
- React (Vite)
- TypeScript (Strict)
- Tailwind CSS

## TypeScript Rules
- Define types/interfaces for all component props.
- No 'any'. Use 'unknown' if type is truly uncertain.
- Use 'type' for unions/simple objects, 'interface' for extendable data structures.

## Style Preferences
- Use Arrow Functions for all components and hooks.
- Use early returns to reduce nesting.
- Prioritize Semantic HTML tags.

## React Specifics
- Functional components only.
- Use `useState` and `useEffect` correctly (always clean up effects).
- Prefer Lucide-react for icons.