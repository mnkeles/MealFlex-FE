import { useQuery } from "@tanstack/react-query";
import {
  locationService,
  type LocationOption,
} from "@/services/locationService";

interface LocationValue {
  city: string;
  district: string;
  neighborhood: string;
}

const normalize = (value: string) => value.trim().toLocaleLowerCase("tr-TR");
const findId = (options: LocationOption[] | undefined, name: string) =>
  options?.find((option) => normalize(option.name) === normalize(name))?.id;

function SelectField({
  label,
  value,
  options,
  placeholder,
  disabled,
  loading,
  onChange,
}: {
  label: string;
  value: string;
  options?: LocationOption[];
  placeholder: string;
  disabled?: boolean;
  loading?: boolean;
  onChange: (value: string) => void;
}) {
  const hasLegacyValue =
    !!value &&
    !options?.some((option) => normalize(option.name) === normalize(value));
  return (
    <label className="text-sm font-semibold">
      {label}
      <select
        aria-label={label}
        required
        value={value}
        disabled={disabled || loading}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-xl border bg-white px-3 font-normal disabled:bg-slate-100 disabled:text-slate-500"
      >
        <option value="">{loading ? "Yükleniyor..." : placeholder}</option>
        {hasLegacyValue && <option value={value}>{value}</option>}
        {options?.map((option) => (
          <option key={option.id} value={option.name}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function LocationSelects({
  value,
  onChange,
  includeNeighborhood = true,
}: {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  includeNeighborhood?: boolean;
}) {
  const provinces = useQuery({
    queryKey: ["locations", "provinces"],
    queryFn: locationService.getProvinces,
    staleTime: Infinity,
  });
  const provinceId = findId(provinces.data, value.city);
  const districts = useQuery({
    queryKey: ["locations", "districts", provinceId],
    queryFn: () => locationService.getDistricts(provinceId!),
    enabled: !!provinceId,
    staleTime: Infinity,
  });
  const districtId = findId(districts.data, value.district);
  const neighborhoods = useQuery({
    queryKey: ["locations", "neighborhoods", districtId],
    queryFn: () => locationService.getNeighborhoods(districtId!),
    enabled: includeNeighborhood && !!districtId,
    staleTime: Infinity,
  });
  const error = provinces.error || districts.error || neighborhoods.error;

  return (
    <>
      <SelectField
        label="İl"
        value={value.city}
        options={provinces.data}
        loading={provinces.isLoading}
        placeholder="İl seçin"
        onChange={(city) => onChange({ city, district: "", neighborhood: "" })}
      />
      <SelectField
        label="İlçe"
        value={value.district}
        options={districts.data}
        loading={districts.isLoading}
        disabled={!provinceId}
        placeholder={provinceId ? "İlçe seçin" : "Önce il seçin"}
        onChange={(district) =>
          onChange({ ...value, district, neighborhood: "" })
        }
      />
      {includeNeighborhood && (
        <SelectField
          label="Mahalle"
          value={value.neighborhood}
          options={neighborhoods.data}
          loading={neighborhoods.isLoading}
          disabled={!districtId}
          placeholder={districtId ? "Mahalle seçin" : "Önce ilçe seçin"}
          onChange={(neighborhood) => onChange({ ...value, neighborhood })}
        />
      )}
      {error && (
        <p className="text-sm text-danger-600 sm:col-span-2">
          Konum seçenekleri yüklenemedi. Backend bağlantısını kontrol edip
          tekrar deneyin.
        </p>
      )}
    </>
  );
}
