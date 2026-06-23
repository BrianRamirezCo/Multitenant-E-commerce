import { api } from "../../app/api/api";

/**
 * Image upload endpoint. Sends a multipart form (the image file) to the backend,
 * which uploads it to Cloudinary and returns the URL. Used by the ImageUpload
 * component for the store logo, product images, etc.
 */
export const uploadsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    uploadImage: builder.mutation({
      query: ({ file, kind }) => {
        const formData = new FormData();
        formData.append("image", file);
        if (kind) formData.append("kind", kind);
        return {
          url: "/uploads",
          method: "POST",
          body: formData,
          // Don't set Content-Type manually — the browser sets the multipart
          // boundary automatically when the body is FormData.
        };
      },
    }),
  }),
});

export const { useUploadImageMutation } = uploadsApi;
