import {
  currentImageListAtom,
  stepActiveAtomFamily,
  temporaryDataByStepAtom,
} from "@/atoms/addFormAtomStore";
import ErrorText from "@/components/errorText/ErrorText";
import FormInput from "@/components/input/FormInput";
import DatePickerCalendar from "@/components/picker/DatepickerCalendar";
import { addFormSchema } from "@/schema/addForm/addFormSchema";
import { cls } from "@/utils/dynamicTailwinds";
import { useAtom, useSetAtom } from "jotai";
import { useEffect, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { z } from "zod";
import ImageInput from "@/components/button/ImageInput";
import useViewPort from "@/hooks/useViewport";
import { base64ToFile, fileToBase64 } from "@/utils/imageFileConvert";
import { AddFormStepProps } from "@/types/addform";
import LoadingSkeleton from "./LoadingSkeleton";

const StepOneContents = () => {
  const viewPort = useViewPort();
  const {
    register,
    formState: { errors },
    watch,
    setValue,
    getValues,
  } = useFormContext<z.infer<typeof addFormSchema>>();
  const [currentImageList, setCurrentImageList] = useAtom(currentImageListAtom);
  const setTemporaryDataByStep = useSetAtom(temporaryDataByStepAtom);
  const setStepOneActive = useSetAtom(stepActiveAtomFamily("stepOne"));
  const [temporaryDateRange, setTemporaryDateRange] = useState<
    [string, string]
  >(() => {
    const startDate = watch("recruitmentStartDate");
    const endDate = watch("recruitmentEndDate");
    return [startDate || "", endDate || ""];
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fields = [
    "title",
    "description",
    "recruitmentStartDate",
    "recruitmentEndDate",
  ] as const;
  const [loading, setLoading] = useState(true);

  // 1단계 '작성중' 태그 여부
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name && fields.includes(name as (typeof fields)[number])) {
        const currentValue = value[name as keyof typeof value];
        if (currentValue && String(currentValue).trim() !== "") {
          setStepOneActive(true);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, fields, setStepOneActive]);

  const stepOneData = useMemo(() => {
    return fields.reduce(
      (acc, field) => ({
        ...acc,
        [field]:
          field === "recruitmentStartDate"
            ? temporaryDateRange[0]
            : field === "recruitmentEndDate"
              ? temporaryDateRange[1]
              : watch(field),
      }),
      {} as NonNullable<AddFormStepProps["stepOne"]>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [temporaryDateRange]);

  // 추출한 필수값을 폼에 적용
  useEffect(() => {
    if (stepOneData) {
      fields.forEach((field) => {
        setValue(field, stepOneData[field]);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepOneData, setValue]);

  // 서버에서 가져온 폼이 있을 경우 마운트 시에 데이터 업데이트 (값이 사용자에게 안보이는 경우를 해결함)
  useEffect(() => {
    const startDate = watch("recruitmentStartDate");
    const endDate = watch("recruitmentEndDate");
    if (startDate && endDate) {
      setTemporaryDateRange([startDate, endDate]);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch("recruitmentStartDate"), watch("recruitmentEndDate")]);

  // 임시 데이터 atom 업데이트
  useEffect(() => {
    const title = getValues("title");
    const description = getValues("description");

    const updateTemporaryData = async () => {
      const base64Images = await Promise.all(
        currentImageList.map((img) => fileToBase64(img))
      );

      const temporaryStepOneData = {
        title: title,
        description: description,
        recruitmentStartDate: temporaryDateRange[0],
        recruitmentEndDate: temporaryDateRange[1],
        tempImage: base64Images, // 임시저장을 위해 서버 업로드 전 이미지를 저장
      };

      setTemporaryDataByStep({
        stepOne: temporaryStepOneData,
      });
    };

    updateTemporaryData();
  }, [temporaryDateRange, getValues, setTemporaryDataByStep, currentImageList]);

  // 임시 데이터 있으면 로컬스토리지에서 불러오기
  useEffect(() => {
    const loadData = async () => {
      const localStorageData = localStorage.getItem("stepOne");
      if (localStorageData) {
        const parsedData = JSON.parse(localStorageData);
        fields.forEach((field) => {
          setValue(field, parsedData[field]);
        });

        // 임시 이미지 파일 객체로 변환
        Promise.all(
          parsedData.tempImage.map(async (base64: string) => {
            return await base64ToFile(base64, "imageUrls");
          })
        ).then((files) => {
          setCurrentImageList(files);
        });

        setTemporaryDateRange([
          parsedData.recruitmentStartDate,
          parsedData.recruitmentEndDate,
        ]);
      }
      setLoading(false);
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setValue, setCurrentImageList]);

  if (loading) {
    return <LoadingSkeleton isImage={true} />;
  }

  return (
    <div className="flex flex-col space-y-8 pc:w-[640px]">
      <div className="relative flex flex-col space-y-4">
        <label
          htmlFor="title"
          className="text-md font-medium text-black-400 pc:text-xl"
        >
          알바폼 제목
          <span className="text-orange-300"> *</span>
        </label>
        <FormInput
          id="title"
          type="text"
          placeholder="제목을 입력해주세요."
          register={register}
          error={errors.title}
          name="title"
          className={cls(
            "addform-input-base outline-none",
            errors.title ? "ring-1 ring-red" : ""
          )}
        />
        <ErrorText error={errors.title}>{errors.title?.message}</ErrorText>
      </div>
      <div className="relative flex flex-col space-y-4">
        <label
          htmlFor="description"
          className="text-md font-medium text-black-400 pc:text-xl"
        >
          소개글
          <span className="text-orange-300"> *</span>
        </label>
        <textarea
          id="description"
          {...register("description")}
          rows={5}
          className={cls(
            "addform-input-base outline-none",
            errors.description ? "ring-1 ring-red" : ""
          )}
          placeholder="최대 200자까지 입력 가능합니다."
        />
        <ErrorText error={errors.description}>
          {errors.description?.message}
        </ErrorText>
      </div>
      <div className="flex flex-col space-y-4">
        <label
          htmlFor="recruitmentDate"
          className="text-md font-medium text-black-400 pc:text-xl"
        >
          모집 기간
          <span className="text-orange-300"> *</span>
        </label>
        <DatePickerCalendar
          setDateRange={setTemporaryDateRange}
          initialDate={temporaryDateRange}
        />
        <ErrorText
          error={errors.recruitmentStartDate || errors.recruitmentEndDate}
        >
          {errors.recruitmentStartDate?.message ||
            errors.recruitmentEndDate?.message}
        </ErrorText>
      </div>
      <div className="flex flex-col space-y-4">
        <label
          htmlFor="image"
          className="text-md font-medium text-black-400 pc:text-xl"
        >
          이미지 첨부
        </label>
        <ImageInput
          size={viewPort === "pc" ? "medium" : "small"}
          onImageChange={setCurrentImageList}
          initialImage={currentImageList}
          limit={3}
        />
      </div>
    </div>
  );
};

export default StepOneContents;
