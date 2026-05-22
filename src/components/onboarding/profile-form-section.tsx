import { ProdeButton } from "@/components/prode/prode-button";
import { ProdeCard } from "@/components/prode/prode-card";
import {
  ProdeField,
  ProdeInput,
  ProdeSelect,
  ProdeTextarea,
} from "@/components/prode/prode-field";

export function ProfileFormSection() {
  return (
    <ProdeCard className="p-5 sm:p-6">
      <form className="grid gap-5" aria-label="Perfil del jugador">
        <div className="grid gap-4 md:grid-cols-2">
          <ProdeField htmlFor="nombre-visible" label="Nombre visible">
            <ProdeInput
              autoComplete="nickname"
              id="nombre-visible"
              placeholder="Ej. Pela del Prode"
            />
          </ProdeField>

          <ProdeField htmlFor="edad" label="Edad">
            <ProdeInput id="edad" max={120} min={1} placeholder="29" type="number" />
          </ProdeField>

          <ProdeField htmlFor="nombre" label="Nombre">
            <ProdeInput autoComplete="given-name" id="nombre" placeholder="Lucía" />
          </ProdeField>

          <ProdeField htmlFor="apellido" label="Apellido">
            <ProdeInput
              autoComplete="family-name"
              id="apellido"
              placeholder="Fernández"
            />
          </ProdeField>

          <ProdeField
            className="md:col-span-2"
            htmlFor="club-favorito"
            label="Club / equipo favorito"
          >
            <ProdeInput
              id="club-favorito"
              placeholder="Ej. Argentinos Juniors"
            />
          </ProdeField>

          <ProdeField htmlFor="colegio-grupo" label="Colegio / grupo">
            <ProdeInput id="colegio-grupo" placeholder="Ej. Promo del colegio" />
          </ProdeField>

          <ProdeField
            htmlFor="egreso-categoria"
            label="Año de egreso o categoría"
          >
            <ProdeInput id="egreso-categoria" placeholder="Ej. 2012" />
          </ProdeField>

          <ProdeField htmlFor="pais" label="País">
            <ProdeSelect defaultValue="Argentina" id="pais">
              <option>Argentina</option>
              <option>Uruguay</option>
              <option>Chile</option>
              <option>Otro</option>
            </ProdeSelect>
          </ProdeField>

          <ProdeField htmlFor="provincia" label="Provincia">
            <ProdeInput id="provincia" placeholder="Buenos Aires" />
          </ProdeField>

          <ProdeField className="md:col-span-2" htmlFor="ciudad" label="Ciudad">
            <ProdeInput id="ciudad" placeholder="La Plata" />
          </ProdeField>
        </div>

        <ProdeField
          htmlFor="subgrupo"
          label="Subgrupo / equipo del Prode"
        >
          <ProdeTextarea
            id="subgrupo"
            placeholder="Ej. Los que miran todos los partidos juntos"
          />
        </ProdeField>

        <ProdeButton className="w-full" size="large">
          Listo para jugar
        </ProdeButton>
      </form>
    </ProdeCard>
  );
}
