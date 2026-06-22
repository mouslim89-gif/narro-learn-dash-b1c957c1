---
name: add-book-audio
description: Automates adding synchronized audio playback and UI controls to books.
---
# Add Book Audio Skill

This skill automates the process of adding audio capabilities to books in the Tsundoku application. It handles everything from data structure updates to UI component integration for synchronized audio playback.

## When to use
Use this skill when a user wants to:
- Add an audio version to an existing book.
- Implement "karaoke-style" text highlighting synchronized with audio.
- Add audio controls (play/pause/speed) to the Reader.

## Data Structure Requirements
Books in `src/data/books.ts` must be updated to include:
- `audioUrl`: String path to the audio file.
- `durations`: Optional duration of the audio in seconds.
- `timestamps`: Array of numbers (seconds) mapping text segments to audio positions.

## Implementation Workflow

### 1. Update Data
Ensure the book entry in `src/data/books.ts` has the necessary audio properties.

### 2. Integration with Reader
The `Reader.tsx` component uses `AudioPlayer.tsx`. Ensure the `hasAudio` flag is set correctly based on the book data.

### 3. Sync Logic
Use the `useAudio` hook to track `currentTime` and compare it against the `timestamps` array to highlight the current sentence or word.

## Best Practices
- **Format**: Use `.mp3` for maximum compatibility or `.m4a` for better quality/size ratio.
- **Accessibility**: Always provide play/pause buttons with clear visual states.
- **Performance**: Lazy-load audio files to avoid slowing down the initial page load.
