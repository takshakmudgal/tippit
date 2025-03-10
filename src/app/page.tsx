import { Container } from "@/components/common/Container";
import Submission from "@/components/home/Submission";

export default function HomePage() {
  return (
    <main className="flex-1 bg-[#121313] w-full">
      <Container>
        <Submission />
      </Container>
    </main>
  );
}
