import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  User,
  GraduationCap,
  MapPin,
  Calendar,
  School,
  IdCard,
} from "lucide-react";
import type { Student } from "@/types";

interface StudentInfoCardProps {
  student: Student;
  formatDate: (dateString: string) => string;
  formatGender: (gender: string) => string;
}

export const StudentInfoCard: React.FC<StudentInfoCardProps> = ({
  student,
  formatDate,
  formatGender,
}) => {
  return (
    <Card className="max-w-2xl w-full shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardContent className="p-8">
        {/* NIS Badge */}
        <div className="text-center mb-6">
          <div className="inline-block bg-primary/10 rounded-lg px-4 py-2">
            <p className="text-lg text-primary font-semibold">
              NIS: {student.nis}
            </p>
          </div>
        </div>

        {/* Detail Biodata */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <InfoItem
              icon={<IdCard className="w-5 h-5 text-primary mt-0.5" />}
              label="Nama Lengkap"
              value={student.name}
            />

            <InfoItem
              icon={<User className="w-5 h-5 text-primary mt-0.5" />}
              label="Jenis Kelamin"
              value={formatGender(student.gender || "")}
            />

            <InfoItem
              icon={<GraduationCap className="w-5 h-5 text-primary mt-0.5" />}
              label="Kelas"
              value={`Kelas ${student.grade_id}`}
            />
          </div>

          <div className="space-y-4">
            <InfoItem
              icon={<Calendar className="w-5 h-5 text-primary mt-0.5" />}
              label="Tempat, Tanggal Lahir"
              value={`${student.p_birth}, ${student.d_birth ? formatDate(student.d_birth) : ""}`}
            />

            <InfoItem
              icon={<MapPin className="w-5 h-5 text-primary mt-0.5" />}
              label="Alamat"
              value={student.address}
            />

            <InfoItem
              icon={<School className="w-5 h-5 text-primary mt-0.5" />}
              label="Sekolah"
              value={student.school?.name}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | undefined;
}

const InfoItem: React.FC<InfoItemProps> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50">
    {icon}
    <div>
      <p className="text-sm text-gray-600">{label}</p>
      <p className="font-semibold text-gray-800">{value}</p>
    </div>
  </div>
);
