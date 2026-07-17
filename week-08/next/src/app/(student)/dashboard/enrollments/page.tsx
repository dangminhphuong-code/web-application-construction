import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { getMyEnrollments } from "@/lib/api/enrollments";
import { getAuthToken } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Học phần đã đăng ký"
};

export const dynamic = "force-dynamic";

export default async function EnrollmentsPage() {
  const token = await getAuthToken();

  if (!token) {
    redirect("/login");
  }

  const enrollments = await getMyEnrollments(token);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Học phần đã đăng ký</h1>
        <p className="mt-2 text-muted-foreground">
          Danh sách lấy từ GraphQL query `myEnrollments`.
        </p>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Học phần</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Sĩ số</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrollments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                  Bạn chưa đăng ký học phần nào.
                </TableCell>
              </TableRow>
            ) : (
              enrollments.map((enrollment) => (
                <TableRow key={enrollment.id}>
                  <TableCell>
                    <div className="font-medium">{enrollment.course.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {enrollment.course.description || "Chưa có mô tả."}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{enrollment.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {enrollment.course.enrolledCount}/{enrollment.course.capacity}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
