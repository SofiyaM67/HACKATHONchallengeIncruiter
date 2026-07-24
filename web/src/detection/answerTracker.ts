export interface AnswerState {
  answering: boolean;
  questionAskedAt: number | null;
  firstKeystrokeAt: number | null;
  keystrokesInBurst: number;
}

export interface AnswerTracker {
  onQuestionAsked: (questionId: string, askedAt: number) => void;
  onKeystroke: () => void;
  setAnswering: (value: boolean) => void;
  isAnswering: () => boolean;
  getState: () => AnswerState;
}

export function createAnswerTracker(): AnswerTracker {
  let answering = false;
  let questionAskedAt: number | null = null;
  let firstKeystrokeAt: number | null = null;
  let keystrokesInBurst = 0;

  return {
    setAnswering(value) {
      answering = value;
      if (!value) {
        questionAskedAt = null;
        firstKeystrokeAt = null;
        keystrokesInBurst = 0;
      }
    },
    isAnswering: () => answering,
    onQuestionAsked(_id, askedAt) {
      questionAskedAt = askedAt;
      firstKeystrokeAt = null;
      keystrokesInBurst = 0;
      answering = true;
    },
    onKeystroke() {
      if (firstKeystrokeAt === null) firstKeystrokeAt = Date.now();
      keystrokesInBurst += 1;
    },
    getState: () => ({
      answering,
      questionAskedAt,
      firstKeystrokeAt,
      keystrokesInBurst,
    }),
  };
}
