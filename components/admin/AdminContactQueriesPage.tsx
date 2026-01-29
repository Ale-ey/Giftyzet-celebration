"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, MessageSquare } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCurrentUserWithProfile } from "@/lib/api/auth";
import { supabase } from "@/lib/supabase/client";

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  query: string;
  created_at: string;
}

export default function AdminContactQueriesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const profile = await getCurrentUserWithProfile();
        if (profile?.role !== "admin") {
          router.push("/");
          return;
        }
        setAuthorized(true);
      } catch {
        router.push("/");
      }
    };
    check();
  }, [router]);

  useEffect(() => {
    if (!authorized) return;

    const fetchSubmissions = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch("/api/admin/contact-queries", {
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {},
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to load contact queries");
          setSubmissions([]);
          return;
        }
        setSubmissions(data.submissions ?? []);
      } catch (e) {
        setError("Failed to load contact queries");
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [authorized]);

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  if (!authorized) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/admin">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <MessageSquare className="h-8 w-8" />
            Contact Queries
          </h1>
          <p className="text-gray-600">
            Contact form submissions from the site footer.
          </p>
        </div>

        <Card className="border border-gray-200 bg-white">
          <CardHeader>
            <CardTitle className="text-gray-900">Submissions</CardTitle>
            <CardDescription className="text-gray-600">
              {submissions.length} submission{submissions.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-gray-500">
                Loading...
              </div>
            ) : error ? (
              <div className="py-12 text-center text-red-600">{error}</div>
            ) : submissions.length === 0 ? (
              <div className="py-12 text-center text-gray-500 flex flex-col items-center gap-2">
                <Mail className="h-12 w-12 text-gray-300" />
                <p>No contact submissions yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                        Name
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                        Message
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 whitespace-nowrap">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-gray-100 hover:bg-gray-50/50"
                      >
                        <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                          {row.name}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          <a
                            href={`mailto:${row.email}`}
                            className="text-primary hover:underline"
                          >
                            {row.email}
                          </a>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 max-w-md">
                          <span className="line-clamp-3 block" title={row.query}>
                            {row.query}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500 whitespace-nowrap">
                          {formatDate(row.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
