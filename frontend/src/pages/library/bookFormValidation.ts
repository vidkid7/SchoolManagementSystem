export type BookFormError = 'required' | 'minLength' | 'maxLength' | 'positiveInteger';
export type BookFormErrors = Partial<Record<'accessionNumber' | 'title' | 'author' | 'category' | 'totalCopies', BookFormError>>;

export interface BookFormValues {
  accessionNumber: string;
  title: string;
  author: string;
  category: string;
  totalCopies: string;
}

export function validateBookForm(values: BookFormValues): BookFormErrors {
  const errors: BookFormErrors = {};
  const accessionNumber = values.accessionNumber.trim();
  const title = values.title.trim();
  const author = values.author.trim();
  const category = values.category.trim();
  const copies = Number(values.totalCopies);

  if (!accessionNumber) errors.accessionNumber = 'required';
  else if (accessionNumber.length < 3) errors.accessionNumber = 'minLength';
  else if (accessionNumber.length > 50) errors.accessionNumber = 'maxLength';

  if (!title) errors.title = 'required';
  else if (title.length > 255) errors.title = 'maxLength';

  if (!author) errors.author = 'required';
  else if (author.length > 255) errors.author = 'maxLength';

  if (!category) errors.category = 'required';
  if (!Number.isInteger(copies) || copies < 1) errors.totalCopies = 'positiveInteger';

  return errors;
}
