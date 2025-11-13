import { IdeaUploadForm } from "@/components/idea-upload-form";
export default function PollPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <h1>Poll Page</h1>
      <p>This is a placeholder for the poll page.</p>
      <IdeaUploadForm />
    </main>
  );
}
