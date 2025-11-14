import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="max-w-2xl w-full space-y-8 text-center">
        {/* Título principal */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-bold text-primary tracking-wider">
            EL ÚLTIMO CASO
          </h1>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            DE LA CAJA GREY
          </h2>
          <div className="h-1 w-32 bg-primary mx-auto"></div>
        </div>

        {/* Descripción */}
        <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Un juego de escape cooperativo digital. 8-12 jugadores. 90 minutos.
          <br />
          <span className="text-accent">¿Podréis resolver el misterio?</span>
        </p>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Button
            onClick={() => navigate("/create")}
            size="lg"
            className="text-lg px-8 py-6 bg-primary hover:bg-primary/90"
          >
            CREAR PARTIDA
          </Button>
          <Button
            onClick={() => navigate("/join")}
            size="lg"
            variant="outline"
            className="text-lg px-8 py-6 border-2 border-primary text-primary hover:bg-primary/10"
          >
            UNIRSE A PARTIDA
          </Button>
        </div>

        {/* Información adicional */}
        <div className="pt-12 grid grid-cols-3 gap-4 max-w-lg mx-auto">
          <div className="space-y-2">
            <div className="text-2xl font-bold text-primary">8-12</div>
            <div className="text-sm text-muted-foreground">JUGADORES</div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-primary">90</div>
            <div className="text-sm text-muted-foreground">MINUTOS</div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-primary">4</div>
            <div className="text-sm text-muted-foreground">FASES</div>
          </div>
        </div>

        {/* Nota sobre la caja física */}
        <div className="pt-8">
          <p className="text-sm text-muted-foreground italic">
            * Requiere una caja física con candado numérico de 4 dígitos
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
