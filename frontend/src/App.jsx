import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Componentes "Dummy" temporales (luego los moverán a sus propios archivos)
const Home = () => <h1 className="text-3xl font-bold text-center mt-10">Catálogo de Subastas</h1>;
const CrearSubasta = () => <h1 className="text-3xl font-bold text-center mt-10">Formulario Crear Subasta</h1>;
const SalaSubasta = () => <h1 className="text-3xl font-bold text-center mt-10">Sala de Subasta en Vivo</h1>;
const Billetera = () => <h1 className="text-3xl font-bold text-center mt-10">Mi Billetera</h1>;
const Perfil = () => <h1 className="text-3xl font-bold text-center mt-10">Mi Perfil</h1>;

function App() {
  return (
    <BrowserRouter>
      {/* Aquí irá el Navbar general que armará el Desarrollador A */}
      <nav className="bg-gray-800 p-4 text-white">
        <ul className="flex gap-4">
          <li><a href="/" className="hover:text-gray-300">Inicio</a></li>
          <li><a href="/crear-subasta" className="hover:text-gray-300">Crear Subasta</a></li>
          <li><a href="/billetera" className="hover:text-gray-300">Billetera</a></li>
        </ul>
      </nav>

      {/* Contenedor principal de las rutas */}
      <main className="container mx-auto p-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/crear-subasta" element={<CrearSubasta />} />
          <Route path="/subasta/:id" element={<SalaSubasta />} />
          <Route path="/billetera" element={<Billetera />} />
          <Route path="/mi-perfil" element={<Perfil />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
