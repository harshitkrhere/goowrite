"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Types matching our database schema
export interface Student {
    id: string;
    institute_id: string;
    admission_number: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    current_status: "active" | "on_leave" | "completed" | "dropped";
    admission_date: string;
    created_at: string;
}

export interface Batch {
    id: string;
    institute_id: string;
    name: string;
    course_id: string;
    schedule: string | null;
    is_active: boolean;
    course?: Course;
    student_count?: number;
}

export interface Course {
    id: string;
    institute_id: string;
    name: string;
    description: string | null;
    is_active: boolean;
}

export interface StudentFee {
    id: string;
    institute_id: string;
    student_id: string;
    total_amount: number;
    discount_amount: number;
    final_amount: number;
    amount_paid: number;
    amount_due: number;
    is_fully_paid: boolean;
    student?: Student;
}

export interface Institute {
    id: string;
    name: string;
    code: string;
}

// Hook to get current user's institute
export function useCurrentInstitute() {
    const [institute, setInstitute] = useState<Institute | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchInstitute() {
            const supabase = createClient();

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            // Get first institute the user belongs to
            const { data, error } = await supabase
                .from("user_institute_roles")
                .select("institute_id, institutes(id, name, code)")
                .eq("user_id", user.id)
                .limit(1)
                .single();

            if (error) {
                // Not an error if user has no institutes
                if (error.code !== "PGRST116") {
                    setError(error.message);
                }
            } else if (data?.institutes) {
                setInstitute(data.institutes as unknown as Institute);
            }

            setLoading(false);
        }

        fetchInstitute();
    }, []);

    return { institute, loading, error };
}

// Hook to fetch students
export function useStudents(instituteId: string | undefined) {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!instituteId) {
            setLoading(false);
            return;
        }

        async function fetchStudents() {
            const supabase = createClient();

            const { data, error } = await supabase
                .from("students")
                .select("*")
                .eq("institute_id", instituteId)
                .eq("is_deleted", false)
                .order("created_at", { ascending: false });

            if (error) {
                setError(error.message);
            } else {
                setStudents(data || []);
            }

            setLoading(false);
        }

        fetchStudents();
    }, [instituteId]);

    return { students, loading, error };
}

// Hook to fetch batches with course info and student count
export function useBatches(instituteId: string | undefined) {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!instituteId) {
            setLoading(false);
            return;
        }

        async function fetchBatches() {
            const supabase = createClient();

            const { data, error } = await supabase
                .from("batches")
                .select(`
                    *,
                    courses(id, name, description),
                    batch_students(id, left_at)
                `)
                .eq("institute_id", instituteId)
                .order("created_at", { ascending: false });

            if (error) {
                setError(error.message);
            } else {
                setBatches((data || []).map((b) => ({
                    ...b,
                    course: b.courses as unknown as Course,
                    student_count: Array.isArray(b.batch_students)
                        ? b.batch_students.filter((bs: any) => !bs.left_at)
                            .length
                        : 0,
                })));
            }

            setLoading(false);
        }

        fetchBatches();
    }, [instituteId]);

    return { batches, loading, error };
}

// Hook to fetch courses
export function useCourses(instituteId: string | undefined) {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!instituteId) {
            setLoading(false);
            return;
        }

        async function fetchCourses() {
            const supabase = createClient();

            const { data, error } = await supabase
                .from("courses")
                .select("*")
                .eq("institute_id", instituteId)
                .order("name");

            if (error) {
                setError(error.message);
            } else {
                setCourses(data || []);
            }

            setLoading(false);
        }

        fetchCourses();
    }, [instituteId]);

    return { courses, loading, error };
}

// Hook to fetch student fees
export function useStudentFees(instituteId: string | undefined) {
    const [fees, setFees] = useState<StudentFee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!instituteId) {
            setLoading(false);
            return;
        }

        async function fetchFees() {
            const supabase = createClient();

            const { data, error } = await supabase
                .from("student_fees")
                .select(`
          *,
          students(id, first_name, last_name, admission_number)
        `)
                .eq("institute_id", instituteId)
                .order("created_at", { ascending: false });

            if (error) {
                setError(error.message);
            } else {
                setFees((data || []).map((f) => ({
                    ...f,
                    student: f.students as unknown as Student,
                })));
            }

            setLoading(false);
        }

        fetchFees();
    }, [instituteId]);

    return { fees, loading, error };
}

// Hook to get dashboard stats
export function useDashboardStats(instituteId: string | undefined) {
    const [stats, setStats] = useState({
        totalStudents: 0,
        activeBatches: 0,
        totalCollected: 0,
        totalDue: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!instituteId) {
            setLoading(false);
            return;
        }

        async function fetchStats() {
            const supabase = createClient();

            // Fetch all stats in parallel
            const [studentsRes, batchesRes, feesRes] = await Promise.all([
                supabase
                    .from("students")
                    .select("id", { count: "exact" })
                    .eq("institute_id", instituteId)
                    .eq("is_deleted", false),
                supabase
                    .from("batches")
                    .select("id", { count: "exact" })
                    .eq("institute_id", instituteId)
                    .eq("is_active", true),
                supabase
                    .from("student_fees")
                    .select("amount_paid, amount_due")
                    .eq("institute_id", instituteId),
            ]);

            const totalCollected = (feesRes.data || []).reduce(
                (sum, f) => sum + Number(f.amount_paid),
                0,
            );
            const totalDue = (feesRes.data || []).reduce(
                (sum, f) => sum + Number(f.amount_due),
                0,
            );

            setStats({
                totalStudents: studentsRes.count || 0,
                activeBatches: batchesRes.count || 0,
                totalCollected,
                totalDue,
            });

            setLoading(false);
        }

        fetchStats();
    }, [instituteId]);

    return { stats, loading };
}

// =============================================================================
// TESTS & MARKS MODULE
// =============================================================================

export interface Test {
    id: string;
    institute_id: string;
    batch_id: string;
    name: string;
    test_date: string;
    total_max_marks: number;
    description: string | null;
    created_at: string;
    created_by: string | null;
    batch?: Batch;
}

export interface TestSubject {
    id: string;
    test_id: string;
    subject_name: string;
    max_marks: number;
}

export interface TestSection {
    id: string;
    test_subject_id: string;
    section_name: string;
    max_marks: number;
}

export interface StudentMarks {
    id: string;
    institute_id: string;
    student_id: string;
    test_id: string;
    test_subject_id: string | null;
    test_section_id: string | null;
    marks_obtained: number;
    entered_by: string | null;
    created_at: string;
    updated_at: string;
    student?: Student;
}

export interface MarksHistory {
    id: string;
    student_marks_id: string;
    old_marks: number | null;
    new_marks: number;
    changed_by: string | null;
    changed_at: string;
    reason: string | null;
}

// Hook to fetch tests for an institute
export function useTests(instituteId: string | undefined, batchId?: string) {
    const [tests, setTests] = useState<Test[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!instituteId) {
            setLoading(false);
            return;
        }

        async function fetchTests() {
            const supabase = createClient();

            let query = supabase
                .from("tests")
                .select(`
                    *,
                    batch:batches(id, name, course:courses(id, name))
                `)
                .eq("institute_id", instituteId)
                .eq("is_deleted", false)
                .order("test_date", { ascending: false });

            if (batchId) {
                query = query.eq("batch_id", batchId);
            }

            const { data, error } = await query;

            if (!error && data) {
                setTests(data as Test[]);
            }
            setLoading(false);
        }

        fetchTests();
    }, [instituteId, batchId]);

    return { tests, loading };
}

// Hook to fetch marks for a specific test
export function useTestMarks(testId: string | undefined) {
    const [marks, setMarks] = useState<StudentMarks[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!testId) {
            setLoading(false);
            return;
        }

        async function fetchMarks() {
            const supabase = createClient();

            const { data, error } = await supabase
                .from("student_marks")
                .select(`
                    *,
                    student:students(id, full_name, admission_number)
                `)
                .eq("test_id", testId)
                .order("created_at", { ascending: true });

            if (!error && data) {
                setMarks(data as StudentMarks[]);
            }
            setLoading(false);
        }

        fetchMarks();
    }, [testId]);

    return { marks, loading };
}

// Hook to fetch test subjects
export function useTestSubjects(testId: string | undefined) {
    const [subjects, setSubjects] = useState<TestSubject[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!testId) {
            setSubjects([]);
            setLoading(false);
            return;
        }

        async function fetchSubjects() {
            const supabase = createClient();

            const { data, error } = await supabase
                .from("test_subjects")
                .select("*")
                .eq("test_id", testId)
                .order("created_at", { ascending: true });

            if (!error && data) {
                setSubjects(data as TestSubject[]);
            }
            setLoading(false);
        }

        fetchSubjects();
    }, [testId]);

    return { subjects, loading };
}

// Hook to fetch students in a batch (for marks entry)
export function useBatchStudents(batchId: string | undefined) {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!batchId) {
            setStudents([]);
            setLoading(false);
            return;
        }

        async function fetchStudents() {
            const supabase = createClient();

            const { data, error } = await supabase
                .from("batch_students")
                .select(`
                    student:students(*)
                `)
                .eq("batch_id", batchId)
                .is("left_at", null);

            if (!error && data) {
                const studentList = data
                    .map((d) => d.student)
                    .filter(Boolean) as Student[];
                setStudents(studentList);
            }
            setLoading(false);
        }

        fetchStudents();
    }, [batchId]);

    return { students, loading };
}
