const fs = require('fs');
let track = fs.readFileSync('src/pages/shop/TrackOrder.tsx', 'utf8');

if (!track.includes("import { Layout }")) {
    track = track.replace("import { Helmet } from 'react-helmet-async';", "import { Helmet } from 'react-helmet-async';\nimport { Layout } from '../../components/Layout';");
}

track = track.replace('return (', 'return (\n    <Layout>');
track = track.replace('</div>\n    )', '</div>\n      </div>\n    </Layout>\n  )');

// Replace the grenade image and make it look much more modern
const oldHeaderRegex = /<div className="relative w-48 h-48 mx-auto mb-6[\s\S]*?<\/div>/;
const newHeader = `<div className="relative w-64 h-64 mx-auto mb-8 flex items-center justify-center animate-in zoom-in duration-700">
              <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
              <img 
                src="https://cdn3d.iconscout.com/3d/premium/thumb/delivery-scooter-5296811-4436531.png" 
                alt="Track Delivery" 
                className="w-full h-full object-contain relative z-10 hover:scale-105 transition-transform duration-500 drop-shadow-2xl"
              />
            </div>`;
track = track.replace(oldHeaderRegex, newHeader);

// Enhance the tracking display to support vertical timeline
const horizontalTimelineRegex = /\{step === -1 \? \([\s\S]*?\{order\.shippingAddress\}\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/;

const newTimelineCode = `{order.trackingTimeline && order.trackingTimeline.length > 0 ? (
                <div className="mt-8 border-t border-gray-100 pt-8 animate-in slide-in-from-bottom-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Activity size={24} className="text-blue-600" />
                    Live Tracking Status
                  </h3>
                  
                  <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:inset-0 before:ml-[2.25rem] sm:before:ml-[2.75rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blue-600 before:via-blue-300 before:to-transparent">
                    {order.trackingTimeline.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((event, idx) => (
                      <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-blue-600 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                          <CheckCircle2 size={20} />
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-200 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1">
                            <h4 className="font-bold text-gray-900 text-lg capitalize">{event.status}</h4>
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{new Date(event.timestamp).toLocaleString()}</span>
                          </div>
                          {event.description && <p className="text-gray-600 text-sm mt-2">{event.description}</p>}
                          {event.location && (
                            <div className="flex items-center gap-1.5 text-gray-500 text-sm mt-3 bg-gray-50 p-2 rounded-lg inline-flex">
                              <MapPin size={16} className="text-red-500" /> {event.location}
                            </div>
                          )}
                          {event.deliveryMan && (
                            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">{event.deliveryMan.name.charAt(0)}</div>
                              <div className="text-sm">
                                <p className="font-bold text-gray-900">{event.deliveryMan.name}</p>
                                <p className="text-gray-500">{event.deliveryMan.phone}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {/* Fallback to horizontal timeline if no detailed tracking timeline */}
                  {step === -1 ? (
                    <div className="text-center py-12 bg-red-50 rounded-2xl border border-red-100">
                      <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-red-700 mb-2">Order Cancelled</h3>
                      <p className="text-red-500">This order has been cancelled.</p>
                    </div>
                  ) : (
                    <div className="relative mt-12 mb-16 px-4">
                      <div className="absolute top-1/2 left-4 right-4 h-1 bg-gray-100 -translate-y-1/2 z-0 rounded-full"></div>
                      <div 
                        className="absolute top-1/2 left-4 h-1 bg-blue-600 -translate-y-1/2 z-0 rounded-full transition-all duration-1000 ease-in-out"
                        style={{ width: \`calc(\${(step / (steps.length - 1)) * 100}% - 2rem)\` }}
                      ></div>
                      
                      <div className="relative z-10 flex justify-between">
                        {steps.map((s, i) => (
                          <div key={i} className="flex flex-col items-center">
                            <div className={\`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-500 \${
                              i <= step ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-110' : 'bg-white border-2 border-gray-200 text-gray-400'
                            }\`}>
                              <s.icon size={20} />
                            </div>
                            <div className="text-center mt-3 absolute top-12 md:top-14 w-24 -ml-8 md:-ml-6">
                              <p className={\`text-xs md:text-sm font-bold \${i <= step ? 'text-blue-900' : 'text-gray-500'}\`}>{s.label}</p>
                              <p className="text-[10px] md:text-xs text-gray-400 mt-0.5 leading-tight">{s.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Order Details */}
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mt-20">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <MapPin size={18} className="text-blue-600" />
                      Shipping Details
                    </h3>
                    <div className="text-gray-600 text-sm space-y-1">
                      <p className="font-semibold text-gray-900">{order.customerName}</p>
                      <p>{order.shippingAddress}</p>
                      <p>{order.customerPhone}</p>
                    </div>
                  </div>
                </>
              )}`;

track = track.replace(horizontalTimelineRegex, newTimelineCode);

if (!track.includes('import { Activity }')) {
    track = track.replace("import { Package, Search, Truck, CheckCircle2, Clock, MapPin, Download, AlertCircle } from 'lucide-react';", "import { Package, Search, Truck, CheckCircle2, Clock, MapPin, Download, AlertCircle, Activity } from 'lucide-react';");
}


fs.writeFileSync('src/pages/shop/TrackOrder.tsx', track, 'utf8');