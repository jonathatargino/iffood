import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useCreateStore } from "./use-create-store";
import { storeFormSchema, type StoreFormData } from "./schema";
import { PhotoUploadField } from "./components/photo-upload-field";
import { StoreInfoFields } from "./components/store-info-fields";
import { FormHeader, InfoCard, SubmitButton } from "./components/form-sections";

type StoreFormProps = {
  onBack: () => void;
  onSave: () => void;
};

export function StoreForm({ onBack, onSave }: StoreFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<StoreFormData>({
    resolver: zodResolver(storeFormSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      whatsapp: "",
      photo: undefined,
    },
  });

  const createStoreMutation = useCreateStore(
    () => {
      onSave();
    },
    () => {
      toast.error("Erro ao criar loja", {
        description: "Não foi possível criar a loja. Tente novamente.",
      });
    }
  );

  const description = watch("description");

  const handlePhotoSelect = (file: File) => {
    setValue("photo", file, { shouldValidate: true });
  };

  const onSubmit = (data: StoreFormData) => {
    createStoreMutation.mutate({
      name: data.name,
      description: data.description,
      whatsapp: data.whatsapp,
      photo: data.photo,
    });
  };

  return (
    <div className="bg-[#fafafa] min-h-screen pb-8">
      <FormHeader onBack={onBack} />

      <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6 space-y-6">
        <PhotoUploadField
          error={errors.photo}
          onPhotoSelect={handlePhotoSelect}
        />

        <StoreInfoFields
          register={register}
          setValue={setValue}
          errors={errors}
          descriptionLength={description?.length || 0}
        />

        <InfoCard />

        <SubmitButton
          isValid={isValid}
          isSubmitting={createStoreMutation.isPending}
        />
      </form>
    </div>
  );
}
