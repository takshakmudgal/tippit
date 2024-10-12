import { Container } from "@/components/common/Container";
import Submission from "@/components/home/Submission";
import SubmissionList from "@/components/home/SubmissionList";

export default function HomePage() {
  return (
    <main>
      <Container>
        <Submission />
        <SubmissionList />
      </Container>
    </main>
  );
}
