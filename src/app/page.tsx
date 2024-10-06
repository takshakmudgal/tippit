import { Container } from "@/components/common/Container";

export default async function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <Container className="space-y-20">
        <span className="font-semibold text-white text-4xl flex justify-center">
          community tips, community projects
        </span>
      </Container>
    </main>
  );
}
