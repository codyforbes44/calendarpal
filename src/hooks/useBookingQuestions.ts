import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BookingQuestion {
  id: string;
  event_type_id: string;
  label: string;
  type: "text" | "textarea" | "select" | "multiselect";
  options: string[];
  is_required: boolean;
  include_other: boolean;
  sort_order: number;
  created_at: string;
}

export interface BookingAnswer {
  id: string;
  booking_id: string;
  question_id: string;
  answer: string | string[];
  created_at: string;
}

const questionKeys = {
  all: ["bookingQuestions"] as const,
  byEvent: (eventTypeId: string) => [...questionKeys.all, eventTypeId] as const,
  answersByBooking: (bookingId: string) => ["bookingAnswers", bookingId] as const,
};

export function useBookingQuestions(eventTypeId: string | undefined) {
  return useQuery({
    queryKey: questionKeys.byEvent(eventTypeId ?? ""),
    queryFn: async () => {
      if (!eventTypeId) return [];
      const { data, error } = await supabase
        .from("booking_questions")
        .select("*")
        .eq("event_type_id", eventTypeId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []).map((q: any) => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : [],
      })) as BookingQuestion[];
    },
    enabled: !!eventTypeId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useBookingAnswers(bookingId: string | undefined) {
  return useQuery({
    queryKey: questionKeys.answersByBooking(bookingId ?? ""),
    queryFn: async () => {
      if (!bookingId) return [];
      const { data, error } = await supabase
        .from("booking_answers")
        .select("*, booking_questions(label, type)")
        .eq("booking_id", bookingId);
      if (error) throw error;
      return (data || []) as (BookingAnswer & { booking_questions: { label: string; type: string } })[];
    },
    enabled: !!bookingId,
  });
}

export function useSaveBookingQuestions(eventTypeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (questions: Omit<BookingQuestion, "id" | "created_at">[]) => {
      // Delete existing questions for this event type
      const { error: deleteError } = await supabase
        .from("booking_questions")
        .delete()
        .eq("event_type_id", eventTypeId);
      if (deleteError) throw deleteError;

      if (questions.length === 0) return [];

      const { data, error } = await supabase
        .from("booking_questions")
        .insert(questions.map((q, i) => ({
          event_type_id: eventTypeId,
          label: q.label,
          type: q.type,
          options: q.options,
          is_required: q.is_required,
          include_other: q.include_other,
          sort_order: i,
        })))
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionKeys.byEvent(eventTypeId) });
    },
    onError: () => {
      toast.error("Failed to save custom questions");
    },
  });
}

export function useInsertBookingAnswers() {
  return useMutation({
    mutationFn: async (answers: { booking_id: string; question_id: string; answer: string | string[] }[]) => {
      if (answers.length === 0) return;
      const { error } = await supabase
        .from("booking_answers")
        .insert(answers.map(a => ({
          booking_id: a.booking_id,
          question_id: a.question_id,
          answer: JSON.stringify(a.answer),
        })));
      if (error) throw error;
    },
  });
}
