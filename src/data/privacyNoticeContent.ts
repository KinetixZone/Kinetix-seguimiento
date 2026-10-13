export const CURRENT_PRIVACY_NOTICE_VERSION = 'AV-KINETIX-2026-01';
export const PRIVACY_NOTICE_EFFECTIVE_DATE = '7 de octubre de 2026';

export interface PrivacySection {
  id: string;
  number: string;
  title: string;
  paragraphs?: string[];
  subsections?: {
    letter?: string;
    title: string;
    items?: string[];
    note?: string;
  }[];
  numberedList?: string[];
  bulletList?: string[];
  highlight?: string;
}

export interface PrivacyNoticeContent {
  version: string;
  effectiveDate: string;
  responsibleName: string;
  responsibleAddress: string;
  contactEmail: string;
  sections: PrivacySection[];
}

export const OFFICIAL_PRIVACY_NOTICE_DOCUMENT: PrivacyNoticeContent = {
  version: CURRENT_PRIVACY_NOTICE_VERSION,
  effectiveDate: PRIVACY_NOTICE_EFFECTIVE_DATE,
  responsibleName: 'Kinetix Functional Zone',
  responsibleAddress: 'Genovevo Rivas 3-81, San Felipe de Jesús Nte., Gustavo A. Madero, C.P. 07510, Ciudad de México, México.',
  contactEmail: 'kinetix.zone@gmail.com',
  sections: [
    {
      id: 'introduccion',
      number: '',
      title: 'Estimado Usuario',
      paragraphs: [
        'Kinetix Functional Zone, con domicilio en Genovevo Rivas 3-81, San Felipe de Jesús Nte., Gustavo A. Madero, C.P. 07510, Ciudad de México, México, es responsable del tratamiento, uso y protección de los datos personales que usted proporcione a través de Kinetix Progress.',
        'En cumplimiento de la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y demás disposiciones aplicables, ponemos a su disposición el presente Aviso de Privacidad Integral, con la finalidad de informarle sobre los datos personales que serán tratados, las finalidades de su tratamiento y los mecanismos disponibles para ejercer sus derechos.'
      ]
    },
    {
      id: 'datos-tratados',
      number: '1',
      title: 'Datos Personales que Serán Tratados',
      paragraphs: [
        'Para el funcionamiento de Kinetix Progress y las finalidades señaladas en el presente Aviso de Privacidad, podremos recabar y tratar las siguientes categorías de datos personales:'
      ],
      subsections: [
        {
          letter: 'a',
          title: 'Datos de identificación y contacto',
          items: [
            'Nombre completo.',
            'Edad.',
            'Sexo / Género.',
            'Fecha de nacimiento.',
            'Correo electrónico.',
            'Teléfono de contacto.'
          ]
        },
        {
          letter: 'b',
          title: 'Datos relacionados con el entrenamiento y rendimiento físico',
          items: [
            'Cargas utilizadas durante los entrenamientos.',
            'Registros y estimaciones de repetición máxima (1RM).',
            'Resultados de pruebas de fuerza y resistencia.',
            'Resultados del Test de Cooper.',
            'Marcas, registros e indicadores relacionados con el rendimiento y evolución física y deportiva.'
          ]
        },
        {
          letter: 'c',
          title: 'Datos relacionados con la composición corporal',
          items: [
            'Peso corporal (kg).',
            'Índice de Masa Corporal (IMC).',
            'Clasificación del IMC calculado.',
            'Masa muscular (%).',
            'Grasa corporal (%).',
            'Grasa visceral (escala de bioimpedancia).'
          ],
          note: 'Kinetix Progress podrá calcular o generar determinados indicadores, como el Índice de Masa Corporal (IMC) y su clasificación, a partir de los datos registrados por el usuario.'
        },
        {
          letter: 'd',
          title: 'Fotografías de progreso',
          items: [
            'El usuario podrá incorporar voluntariamente fotografías con la finalidad de llevar un registro visual de su progreso y evolución física.',
            'Las fotografías proporcionadas a través de Kinetix Progress no serán utilizadas para fines publicitarios, promocionales, mercadológicos, para su publicación en redes sociales ni para finalidades distintas de las establecidas en el presente Aviso de Privacidad.'
          ]
        }
      ]
    },
    {
      id: 'datos-sensibles',
      number: '2',
      title: 'Datos Personales Sensibles',
      paragraphs: [
        'Para el desarrollo, planificación y seguimiento del entrenamiento, Kinetix Progress podrá recabar y tratar datos personales sensibles, particularmente aquellos relacionados con la condición física o el estado de salud del usuario.',
        'El usuario podrá proporcionar información u observaciones médicas que considere relevantes para el desarrollo de su entrenamiento, incluyendo, en su caso: lesiones, padecimientos, restricciones para realizar actividad física, condiciones de salud y otras observaciones médicas relevantes para la planificación y desarrollo de su entrenamiento.',
        'Asimismo, debido a su naturaleza y a la información que pueden revelar sobre la condición física o de salud del usuario, los datos relativos a la composición corporal serán tratados con las medidas de protección correspondientes.',
        'Los datos personales sensibles serán utilizados exclusivamente para las finalidades establecidas en este Aviso de Privacidad y se procurará que su tratamiento se limite al periodo mínimo indispensable.'
      ]
    },
    {
      id: 'finalidades',
      number: '3',
      title: 'Finalidades del Tratamiento',
      paragraphs: [
        'Los datos personales recabados a través de Kinetix Progress serán utilizados para las siguientes finalidades primarias y necesarias:'
      ],
      numberedList: [
        'Crear, identificar, administrar y mantener el perfil del usuario en Kinetix Progress.',
        'Registrar, organizar, consultar y dar seguimiento a los avances y evolución física y deportiva del usuario.',
        'Registrar y dar seguimiento a las cargas utilizadas durante los entrenamientos, registros de repetición máxima (1RM) y demás indicadores relacionados con fuerza y rendimiento.',
        'Registrar y dar seguimiento a los resultados obtenidos en las pruebas de resistencia y demás evaluaciones físicas, incluyendo el Test de Cooper.',
        'Registrar, calcular y dar seguimiento a indicadores de composición corporal, incluyendo peso corporal, IMC, masa muscular, grasa corporal y grasa visceral.',
        'Generar indicadores derivados de los datos proporcionados por el usuario cuando así lo permitan las funcionalidades de Kinetix Progress.',
        'Permitir al usuario consultar su historial y evolución física y deportiva.',
        'Permitir al usuario llevar voluntariamente un registro fotográfico de su progreso y evolución física.',
        'Considerar las observaciones médicas, lesiones, restricciones o condiciones de salud proporcionadas por el usuario que resulten relevantes para la planificación, adaptación y desarrollo de su entrenamiento.',
        'Facilitar la planificación y seguimiento del entrenamiento y los avances del usuario en Kinetix Functional Zone.'
      ],
      highlight: 'Finalidades secundarias: Los datos personales recabados a través de Kinetix Progress no serán utilizados para finalidades publicitarias, promocionales o mercadológicas. En particular, las fotografías de progreso físico no serán utilizadas para publicidad, promoción o difusión en redes sociales.'
    },
    {
      id: 'consentimiento-sensibles',
      number: '4',
      title: 'Consentimiento para el Tratamiento de Datos Personales Sensibles',
      paragraphs: [
        'Kinetix Functional Zone obtendrá el consentimiento expreso del usuario para el tratamiento de sus datos personales sensibles mediante el mecanismo electrónico de autenticación y aceptación implementado en Kinetix Progress.',
        'Al ingresar por primera vez a la plataforma, el usuario tendrá a su disposición el Aviso de Privacidad correspondiente y podrá manifestar su consentimiento mediante la casilla específicamente habilitada para el tratamiento de datos personales sensibles.',
        'El otorgamiento del consentimiento quedará asociado a la cuenta del usuario y Kinetix Functional Zone conservará constancia de su manifestación conforme a las disposiciones aplicables.'
      ]
    },
    {
      id: 'transferencias',
      number: '5',
      title: 'Transferencias de Datos Personales',
      paragraphs: [
        'Kinetix Functional Zone no transferirá los datos personales recabados a través de Kinetix Progress a terceros para fines publicitarios, promocionales o mercadológicos.',
        'Los datos personales únicamente podrán ser transferidos cuando resulte necesario y dicha transferencia se encuentre permitida por la legislación aplicable sin requerir el consentimiento del titular.',
        'En caso de que se pretenda realizar una transferencia que requiera el consentimiento del titular, éste será informado previamente y se obtendrá el consentimiento correspondiente conforme a la legislación aplicable.'
      ]
    },
    {
      id: 'medidas-seguridad',
      number: '6',
      title: 'Medidas de Seguridad y Confidencialidad',
      paragraphs: [
        'Kinetix Functional Zone establecerá y mantendrá las medidas de seguridad administrativas, técnicas y físicas necesarias para proteger los datos personales contra daño, pérdida, alteración, destrucción, así como contra su uso, acceso o tratamiento no autorizado.',
        'Las medidas de seguridad aplicables tendrán en consideración la naturaleza de los datos tratados y, particularmente, la sensibilidad de la información relacionada con la condición física y de salud de los usuarios.',
        'Asimismo, las personas que intervengan en cualquier fase del tratamiento deberán conservar la confidencialidad respecto de los datos personales.'
      ]
    },
    {
      id: 'derechos-arco',
      number: '7',
      title: 'Derechos de Acceso, Rectificación, Cancelación y Oposición (ARCO)',
      paragraphs: [
        'El titular podrá ejercer en cualquier momento los derechos de Acceso, Rectificación, Cancelación y Oposición (ARCO) respecto de sus datos personales, conforme a la legislación aplicable.',
        'El titular podrá solicitar: Acceder a sus datos personales y conocer las condiciones de su tratamiento; Rectificar sus datos cuando sean inexactos o incompletos; Cancelar sus datos personales cuando proceda legalmente; u Oponerse al tratamiento por causa legítima.'
      ],
      subsections: [
        {
          title: 'Procedimiento para ejercer los derechos ARCO',
          items: [
            'Enviar una solicitud al correo electrónico oficial: kinetix.zone@gmail.com',
            'Indicar el nombre completo del titular.',
            'Acompañar documento que acredite la identidad del titular o de su representante.',
            'Describir de forma clara y precisa los datos respecto de los que busca ejercer sus derechos y la solicitud concreta.',
            'Kinetix comunicará la respuesta en un plazo máximo de 20 días hábiles conforme a la ley.'
          ]
        }
      ]
    },
    {
      id: 'revocacion',
      number: '8',
      title: 'Revocación del Consentimiento',
      paragraphs: [
        'El titular podrá solicitar en cualquier momento la revocación del consentimiento otorgado para el tratamiento de sus datos personales, cuando resulte procedente, sin efectos retroactivos.',
        'Para solicitar la revocación deberá enviar su solicitud al correo: kinetix.zone@gmail.com',
        'Cuando el tratamiento de determinados datos personales resulte necesario para proporcionar las funcionalidades de seguimiento de entrenamiento y composición corporal, la revocación podrá ocasionar que dichas funcionalidades no puedan ser proporcionadas.'
      ]
    },
    {
      id: 'limitacion',
      number: '9',
      title: 'Limitación del Uso o Divulgación',
      paragraphs: [
        'El titular podrá solicitar en cualquier momento la limitación del uso o divulgación de sus datos personales enviando un correo a kinetix.zone@gmail.com, indicando los datos respecto de los cuales solicita dicha limitación.'
      ]
    },
    {
      id: 'conservacion',
      number: '10',
      title: 'Conservación de los Datos Personales',
      paragraphs: [
        'Los datos personales serán conservados durante el tiempo necesario para cumplir las finalidades establecidas en el presente Aviso de Privacidad y, en su caso, durante los periodos adicionales exigidos por las obligaciones legales aplicables.',
        'Cuando los datos personales hayan dejado de ser necesarios para las finalidades que justificaron su tratamiento, se procederá a su bloqueo y posterior supresión conforme a la ley.',
        'Tratándose de datos personales sensibles, se limitará el periodo de tratamiento al mínimo indispensable para el cumplimiento de las finalidades correspondientes.'
      ]
    },
    {
      id: 'tecnologias',
      number: '11',
      title: 'Uso de Tecnologías en Kinetix Progress',
      paragraphs: [
        'Kinetix Progress utiliza almacenamiento local y tecnologías estrictamente necesarias para permitir el funcionamiento técnico, la seguridad, la autenticación y el mantenimiento de la sesión del usuario.',
        'En caso de implementarse tecnologías adicionales que recaben datos personales adicionales, se informará oportunamente al titular.'
      ]
    },
    {
      id: 'modificaciones',
      number: '12',
      title: 'Modificaciones al Aviso de Privacidad',
      paragraphs: [
        'Kinetix Functional Zone podrá modificar o actualizar el presente Aviso de Privacidad con motivo de reformas legislativas, nuevas funciones de Kinetix Progress o cambios en las prácticas de tratamiento.',
        'Las modificaciones estarán disponibles de manera permanente en la sección “Aviso de Privacidad” de Kinetix Progress.',
        'Cuando una modificación implique nuevas finalidades o tratamientos que requieran consentimiento, se recabará nuevamente mediante el mecanismo correspondiente.'
      ]
    },
    {
      id: 'consentimiento-final',
      number: '13',
      title: 'Consentimiento',
      paragraphs: [
        'El usuario manifiesta que ha tenido a su disposición el presente Aviso de Privacidad Integral y que ha sido informado sobre las características y finalidades del tratamiento de sus datos personales.',
        'El consentimiento expreso para el tratamiento de datos personales sensibles es recabado a través del mecanismo electrónico de autenticación y aceptación implementado en Kinetix Progress, dejando constancia de su otorgamiento vinculada a la cuenta del usuario.'
      ]
    }
  ]
};
