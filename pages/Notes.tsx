interface NotesPageProps {
  html: string;
}

export const NotesPage = ({ html }: NotesPageProps) => {
  return (
    <div class="notes-page" dangerouslySetInnerHTML={{ __html: html }}>
    </div>
  );
};
