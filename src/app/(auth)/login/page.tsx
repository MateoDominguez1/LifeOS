import { getT } from "@/lib/i18n";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const { t } = await getT();
  return <LoginForm t={t.auth} />;
}
