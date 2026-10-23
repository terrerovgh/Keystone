'use client';
import type { Element } from '@/lib/project';
import { PATIO_ESTIMATE } from '@/lib/patio-estimate';
import { feetLabel } from '@/lib/site-reference';

export default function PatioEstimateReview({elements,onSelect,onPlan}:{elements:Element[];onSelect:(id:string)=>void;onPlan:()=>void}){
 const find=(id:string)=>elements.find(e=>e.id===id),floor=find('back-floor'),pool=find('pool'),house=find('rear-covered-terrace'),dock=find('dock'),stairs=find('steps'),down=find('dock-stairs');
 if(!floor||!pool||!house||!dock||!stairs||!down)return null;
 const level=(n:number)=>`${n>0?'+':''}${Math.round(n*12)}″`;
 return <section className="patio-estimate-review"><p className="eyebrow">ESTIMACIÓN AJUSTADA · CROQUIS APLICADO</p><h3>Casa, patio y muelle.</h3>
 <p>El croquis controla las longitudes. El plano y las fotos públicas aclaran la terraza en L, las alas, el balcón superior y la escalera central. Fotos del propietario, videos y ortofoto completan el ajuste.</p>
 <svg viewBox="0 0 300 118" role="img" aria-label="Sección estimada: casa elevada, escalones al patio y bajada al muelle inferior">
 <path d="M10 32H80v9h8v9h8v9h8v9h110v10h12v10h62" fill="none" stroke="#735b40" strokeWidth="3"/>
 <path d="M10 98H290" stroke="#c6cebc" strokeDasharray="3 3"/>
 <g fill="#52654a" fontSize="10"><text x="12" y="17">Casa {level(house.elevation)}</text><text x="125" y="54">Patio {level(floor.elevation)}</text><text x="224" y="108">Muelle {level(dock.elevation)}</text></g>
 </svg>
 <dl><div><dt>Ancho interpretado</dt><dd>{feetLabel(floor.width)} · 16′ + 50′</dd></div><div><dt>Fondos del croquis</dt><dd>37′ izquierda / 27′ derecha</dd></div><div><dt>Vaso estimado de agua</dt><dd>{feetLabel(pool.width-1)} × {feetLabel(pool.depth-1)}</dd></div><div><dt>Borde exterior de piscina</dt><dd>{feetLabel(pool.width)} × {feetLabel(pool.depth)}</dd></div></dl>
 <button onClick={()=>{onSelect(stairs.id);onPlan()}}>Escalera central: 4 × {Math.round(stairs.height*12/4)}″ · ancho {feetLabel(stairs.width)} ↗</button>
 <button onClick={()=>{onSelect(down.id);onPlan()}}>Bajada al muelle: 2 × {Math.round(down.height*12/2)}″ · ancho {feetLabel(down.width)} ↗</button>
 <p className="estimate-assumption">Interpretación de cierre: los 16′ y 50′ se toman contiguos. Los 4′ y 5′ se sitúan hasta el agua; coronación nominal 6″. El margen a la casa y las dimensiones del vaso se deducen del ajuste, no están escritos como tales en el croquis.</p>
 <p className="estimate-assumption">El muelle inferior lo confirmaste tú. Casa +28″ y muelle −14″ son valores de trabajo: se estiman 24–32″ y 10–18″ respectivamente. Cuenta y dimensiones de escalones por comprobar. El dibujo de sección es esquemático.</p>
 <a href="/references/listing/plano-publicado.png" target="_blank" rel="noreferrer"><img src="/references/listing/plano-publicado.png" alt="Plano publicado de la casa con patio cubierto en L, piscina y escalera central"/></a>
 <a href="/references/listing/escalera-central-publicada.png" target="_blank" rel="noreferrer"><img src="/references/listing/escalera-central-publicada.png" alt="Foto desde el muelle: escalera central achaflanada, ala baja y porche abierto bajo los pisos superiores"/></a>
 <p className="estimate-assumption">La vista desde el muelle guía la forma achaflanada de la escalera, el porche bajo las habitaciones y el balcón angular. La foto lateral contrasta los cambios de nivel. Las proporciones de los pisos superiores y la escalera de caracol siguen estimadas.</p>
 <a href={PATIO_ESTIMATE.listing} target="_blank" rel="noreferrer">Fuente del plano y fotografía pública ↗</a></section>;
}
