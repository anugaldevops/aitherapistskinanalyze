export interface ExerciseStep {
  instruction: string;
  duration?: number;
}

export interface TherapyExercise {
  id: string;
  title: string;
  description: string;
  type: 'visualization' | 'breathing' | 'journaling';
  steps: ExerciseStep[];
  icon: string;
}

export const therapyExercises: TherapyExercise[] = [
  {
    id: 'inner-child-visualization',
    title: 'Meeting Your Inner Child',
    description: 'A gentle guided visualization to connect with your younger self',
    type: 'visualization',
    icon: '🧸',
    steps: [
      {
        instruction: 'Find a comfortable, quiet place where you won\'t be disturbed. Close your eyes and take three deep breaths.',
        duration: 30
      },
      {
        instruction: 'Imagine yourself in a safe, peaceful place. It could be a room, a garden, or anywhere you feel completely secure.',
        duration: 20
      },
      {
        instruction: 'In this safe space, notice a younger version of yourself approaching. What age are they? What are they wearing?',
        duration: 30
      },
      {
        instruction: 'Greet your inner child warmly. Notice how they feel. Are they happy? Sad? Scared? Just observe without judgment.',
        duration: 30
      },
      {
        instruction: 'Ask your inner child: "What do you need from me right now?" Listen quietly for their answer.',
        duration: 40
      },
      {
        instruction: 'Tell your inner child: "I see you. I hear you. You are safe with me. I will take care of you."',
        duration: 30
      },
      {
        instruction: 'Give your inner child a hug or hold their hand. Feel the connection between you.',
        duration: 30
      },
      {
        instruction: 'When you\'re ready, gently return to the present moment. Open your eyes. Take a deep breath.',
        duration: 20
      }
    ]
  },
  {
    id: 'calming-breathwork',
    title: 'Calming Breath Work',
    description: 'The 4-7-8 breathing technique to reduce anxiety and stress',
    type: 'breathing',
    icon: '🌬️',
    steps: [
      {
        instruction: 'Sit comfortably with your back straight. Place the tip of your tongue against the ridge behind your upper front teeth.',
        duration: 10
      },
      {
        instruction: 'Exhale completely through your mouth, making a whoosh sound.',
        duration: 5
      },
      {
        instruction: 'Close your mouth and inhale quietly through your nose for 4 counts. 1... 2... 3... 4...',
        duration: 4
      },
      {
        instruction: 'Hold your breath for 7 counts. 1... 2... 3... 4... 5... 6... 7...',
        duration: 7
      },
      {
        instruction: 'Exhale completely through your mouth for 8 counts, making a whoosh sound. 1... 2... 3... 4... 5... 6... 7... 8...',
        duration: 8
      },
      {
        instruction: 'This is one breath cycle. Let\'s repeat: Inhale for 4... Hold for 7... Exhale for 8...',
        duration: 19
      },
      {
        instruction: 'Continue this pattern: Inhale for 4... Hold for 7... Exhale for 8...',
        duration: 19
      },
      {
        instruction: 'Final cycle: Inhale for 4... Hold for 7... Exhale for 8... Notice how you feel.',
        duration: 19
      },
      {
        instruction: 'Return to normal breathing. Notice any changes in your body and mind. You did great!',
        duration: 10
      }
    ]
  },
  {
    id: 'self-compassion-journaling',
    title: 'Self-Compassion Journaling',
    description: 'Reflective prompts to cultivate kindness toward yourself',
    type: 'journaling',
    icon: '📝',
    steps: [
      {
        instruction: 'Take out a journal or open a notes app. We\'ll explore some gentle questions together.',
        duration: 10
      },
      {
        instruction: 'Prompt 1: What would I say to a dear friend who was going through what I\'m experiencing right now?',
        duration: 60
      },
      {
        instruction: 'Prompt 2: When I was a child, what made me feel safe and loved? How can I give that to myself now?',
        duration: 60
      },
      {
        instruction: 'Prompt 3: What part of myself have I been criticizing lately? Can I offer understanding instead?',
        duration: 60
      },
      {
        instruction: 'Prompt 4: What does my inner child need to hear from me today?',
        duration: 60
      },
      {
        instruction: 'Prompt 5: What am I grateful for about myself, even in this challenging moment?',
        duration: 60
      },
      {
        instruction: 'Read back what you\'ve written. Notice any patterns or insights. You\'re doing important work.',
        duration: 30
      }
    ]
  },
  {
    id: 'grounding-exercise',
    title: '5-4-3-2-1 Grounding',
    description: 'A sensory awareness exercise to anchor you in the present moment',
    type: 'visualization',
    icon: '🌟',
    steps: [
      {
        instruction: 'This exercise helps when you feel anxious or overwhelmed. Let\'s bring your attention to the present moment.',
        duration: 10
      },
      {
        instruction: 'Look around and name 5 things you can SEE. Say them out loud or in your mind. Take your time.',
        duration: 30
      },
      {
        instruction: 'Now identify 4 things you can TOUCH or FEEL. Notice their texture, temperature, or weight.',
        duration: 30
      },
      {
        instruction: 'Listen carefully and identify 3 things you can HEAR. Even subtle sounds count.',
        duration: 30
      },
      {
        instruction: 'Notice 2 things you can SMELL. If you can\'t smell anything, think of your favorite scents.',
        duration: 30
      },
      {
        instruction: 'Finally, identify 1 thing you can TASTE. Or think about your favorite taste.',
        duration: 20
      },
      {
        instruction: 'Take a deep breath. Notice how you feel more present and grounded. You can use this technique anytime.',
        duration: 20
      }
    ]
  }
];

export const journalingPrompts = [
  'What would I say to a dear friend who was going through what I\'m experiencing right now?',
  'When I was a child, what made me feel safe and loved? How can I give that to myself now?',
  'What part of myself have I been criticizing lately? Can I offer understanding instead?',
  'What does my inner child need to hear from me today?',
  'What am I grateful for about myself, even in this challenging moment?',
  'What emotions am I feeling right now, and where do I feel them in my body?',
  'If my younger self could see me now, what would they be proud of?',
  'What do I need to forgive myself for?',
  'What boundaries do I need to set to take better care of myself?',
  'What brings me joy, and when was the last time I allowed myself to experience it?'
];
