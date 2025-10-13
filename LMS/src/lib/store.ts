import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
  organizationId: string;
}

export interface Organization {
  id: string;
  name: string;
  domain: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  instructorId: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  courseId: string;
  timeLimit?: number;
  maxAttempts?: number;
  passingScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  answers: Record<string, string>;
  score?: number;
  completedAt?: Date;
  createdAt: Date;
}

export interface Progress {
  id: string;
  userId: string;
  courseId: string;
  moduleId?: string;
  lessonId?: string;
  completed: boolean;
  progressPercentage: number;
  lastAccessedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Auth Store
export interface AuthState {
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthActions {
  setUser: (user: User | null) => void;
  setOrganization: (organization: Organization | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (user: User, organization: Organization) => void;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      // State
      user: null,
      organization: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setOrganization: (organization) => set({ organization }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      login: (user, organization) => set({ 
        user, 
        organization, 
        isAuthenticated: true, 
        error: null 
      }),
      logout: () => set({ 
        user: null, 
        organization: null, 
        isAuthenticated: false, 
        error: null 
      }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        organization: state.organization, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

// Course Store
export interface CourseState {
  courses: Course[];
  currentCourse: Course | null;
  isLoading: boolean;
  error: string | null;
}

export interface CourseActions {
  setCourses: (courses: Course[]) => void;
  setCurrentCourse: (course: Course | null) => void;
  addCourse: (course: Course) => void;
  updateCourse: (course: Course) => void;
  removeCourse: (courseId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useCourseStore = create<CourseState & CourseActions>()(
  persist(
    (set) => ({
      // State
      courses: [],
      currentCourse: null,
      isLoading: false,
      error: null,

      // Actions
      setCourses: (courses) => set({ courses }),
      setCurrentCourse: (currentCourse) => set({ currentCourse }),
      addCourse: (course) => set((state) => ({ 
        courses: [...state.courses, course] 
      })),
      updateCourse: (course) => set((state) => ({
        courses: state.courses.map(c => c.id === course.id ? course : c),
        currentCourse: state.currentCourse?.id === course.id ? course : state.currentCourse
      })),
      removeCourse: (courseId) => set((state) => ({
        courses: state.courses.filter(c => c.id !== courseId),
        currentCourse: state.currentCourse?.id === courseId ? null : state.currentCourse
      })),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'course-storage',
      partialize: (state) => ({ 
        courses: state.courses,
        currentCourse: state.currentCourse
      }),
    }
  )
);

// Quiz Store
export interface QuizState {
  quizzes: Quiz[];
  currentQuiz: Quiz | null;
  currentAttempt: QuizAttempt | null;
  isLoading: boolean;
  error: string | null;
}

export interface QuizActions {
  setQuizzes: (quizzes: Quiz[]) => void;
  setCurrentQuiz: (quiz: Quiz | null) => void;
  setCurrentAttempt: (attempt: QuizAttempt | null) => void;
  addQuiz: (quiz: Quiz) => void;
  updateQuiz: (quiz: Quiz) => void;
  removeQuiz: (quizId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useQuizStore = create<QuizState & QuizActions>()(
  persist(
    (set) => ({
      // State
      quizzes: [],
      currentQuiz: null,
      currentAttempt: null,
      isLoading: false,
      error: null,

      // Actions
      setQuizzes: (quizzes) => set({ quizzes }),
      setCurrentQuiz: (currentQuiz) => set({ currentQuiz }),
      setCurrentAttempt: (currentAttempt) => set({ currentAttempt }),
      addQuiz: (quiz) => set((state) => ({ 
        quizzes: [...state.quizzes, quiz] 
      })),
      updateQuiz: (quiz) => set((state) => ({
        quizzes: state.quizzes.map(q => q.id === quiz.id ? quiz : q),
        currentQuiz: state.currentQuiz?.id === quiz.id ? quiz : state.currentQuiz
      })),
      removeQuiz: (quizId) => set((state) => ({
        quizzes: state.quizzes.filter(q => q.id !== quizId),
        currentQuiz: state.currentQuiz?.id === quizId ? null : state.currentQuiz
      })),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'quiz-storage',
      partialize: (state) => ({ 
        quizzes: state.quizzes,
        currentQuiz: state.currentQuiz
      }),
    }
  )
);

// Progress Store
export interface ProgressState {
  progress: Progress[];
  isLoading: boolean;
  error: string | null;
}

export interface ProgressActions {
  setProgress: (progress: Progress[]) => void;
  updateProgress: (progress: Progress) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useProgressStore = create<ProgressState & ProgressActions>()(
  persist(
    (set) => ({
      // State
      progress: [],
      isLoading: false,
      error: null,

      // Actions
      setProgress: (progress) => set({ progress }),
      updateProgress: (progress) => set((state) => ({
        progress: state.progress.map(p => 
          p.id === progress.id ? progress : p
        )
      })),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'progress-storage',
      partialize: (state) => ({ 
        progress: state.progress
      }),
    }
  )
);

// UI Store for global UI state
export interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timestamp: Date;
  }>;
}

export interface UIActions {
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set) => ({
      // State
      sidebarOpen: true,
      theme: 'light',
      notifications: [],

      // Actions
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setTheme: (theme) => set({ theme }),
      addNotification: (notification) => set((state) => ({
        notifications: [...state.notifications, {
          ...notification,
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date()
        }]
      })),
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      })),
      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({ 
        theme: state.theme,
        sidebarOpen: state.sidebarOpen
      }),
    }
  )
);
