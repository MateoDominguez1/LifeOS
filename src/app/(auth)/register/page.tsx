import { getT } from "@/lib/i18n";
import { RegisterForm } from "./RegisterForm";

export default async function RegisterPage() {
  const { t } = await getT();
  return <RegisterForm t={t.auth} />;
}
