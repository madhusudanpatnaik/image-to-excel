import { TableData } from './types';

export const SAMPLE_TABLES: TableData[] = [
  {
    id: 'sample_1',
    tableName: 'Agile Division Directory',
    headers: [
      'Record ID',
      'ISBN / Code',
      'Division Name',
      'Contact Email',
      'Contact Number',
      'Representative Name',
      'Budget Code',
      'Base Address'
    ],
    rows: [
      [
        'KT01RJ1106501',
        '978-35-577291-129-5',
        'Agile Maritime Network Studio',
        'kareens.baker@mail.co.uk',
        '(383) 234-6067',
        'Richard Taylor',
        '3554323',
        '40995 Brown Isle Apt. 814, Allisonmouth, TN 37525'
      ],
      [
        'KT01RJ1106502',
        '978-12-844751-307-2',
        'Strategic Supply Logistics',
        'david.miller@logistic.corp',
        '(812) 555-0199',
        'Patricia Johnson',
        '8835820',
        '1024 Grand Avenue Ste. 400, Des Moines, IA 50309'
      ],
      [
        'KT01RJ1106503',
        '978-84-307991-960-4',
        'Apex Digital Enterprise',
        'contact@apex-digital.com',
        '(206) 443-9821',
        'Marcus Sterling',
        '4397037',
        '889 Pine Street Suite 12, Seattle, WA 98101'
      ],
      [
        'KT01RJ1106504',
        '978-01-338661-501-1',
        'Vanguard Research Labs',
        'dr.clara@vanguard.res.org',
        '(617) 891-2245',
        'Clara Oswald',
        '5015942',
        '77 Massachusetts Ave, Cambridge, MA 02139'
      ]
    ],
    fileName: 'sample_division_directory.png',
    fileSize: '124.5 KB',
    thumbnail: '/src/assets/images/sample_division_directory_1783449766094.jpg',
    status: 'completed'
  },
  {
    id: 'sample_2',
    tableName: 'Rapid E-Commerce Progress',
    headers: [
      'Project Code',
      'System Alias',
      'Team Lead',
      'Host Node Address',
      'Encryption Key Hash',
      'Status Code / Ports',
      'Completion %',
      'Active Sub-Paths'
    ],
    rows: [
      [
        'SNS-NEYQ-27492',
        'UNBC447873',
        'Patriciaetta Johnsonberg',
        'laptop-50.taylor-martin-f2c5',
        '24ac3fcf76774fef809d709a63e4c2ab',
        '90:5214:8551:749',
        '70%',
        'tags/blog/search/explore/list'
      ],
      [
        'SNS-NEYQ-27493',
        'UNBC447874',
        'Alastair Pendelton',
        'desktop-12.supply-chain-a4a1',
        'ef90a1b2c3d4e5f60718293a4b5c6d7e',
        '80:1024:2048:080',
        '95%',
        'user/events/analytics/pages'
      ],
      [
        'SNS-NEYQ-27494',
        'UNBC447875',
        'Helena Rostova',
        'server-88.cloud-infrastructure',
        '33d4e5f60718293a4b5c6d7eef90a1b2',
        '443:8080:3000:000',
        '100%',
        'admin/dashboard/users/billing'
      ]
    ],
    fileName: 'sample_project_progress.png',
    fileSize: '185.2 KB',
    thumbnail: '/src/assets/images/sample_project_progress_1783449780999.jpg',
    status: 'completed'
  }
];
