const LSKEY='overload_v3';
const APP_VERSION='__SWOLE_CAT_VERSION__';
const DATA_SCHEMA_VERSION=1;
const BACKUP_FORMAT='swole-cat-backup';
const BACKUP_FORMAT_VERSION=1;
const RECOVERYKEY='overload_v3_recovery_v1';
const IMPORTSNAPSHOTKEY='overload_v3_pre_import_v1';
const MAX_RECOVERY_SNAPSHOT_CHARS=1500000;
let storageWriteBlocked=false,startupStorageNotice='',recoveredFromSnapshot=false,recoverySnapshotWritten=false,lastStorageError='';

const LIBRARY=[{"id":"lib_0","name":"Barbell Bench Press","muscle":"Chest","equipment":"barbell","pattern":"horizontal_press","custom":false},{"id":"lib_1","name":"Incline Barbell Bench Press","muscle":"Chest","equipment":"barbell","pattern":"incline_press","custom":false},{"id":"lib_2","name":"Dumbbell Bench Press","muscle":"Chest","equipment":"dumbbell","pattern":"horizontal_press","custom":false},{"id":"lib_3","name":"Incline Dumbbell Press","muscle":"Chest","equipment":"dumbbell","pattern":"incline_press","custom":false},{"id":"lib_4","name":"Chest Press Machine","muscle":"Chest","equipment":"machine","pattern":"horizontal_press","custom":false},{"id":"lib_5","name":"Cable Fly","muscle":"Chest","equipment":"cable","pattern":"chest_fly","custom":false},{"id":"lib_6","name":"Pec Deck","muscle":"Chest","equipment":"machine","pattern":"chest_fly","custom":false},{"id":"lib_7","name":"Push-Up","muscle":"Chest","equipment":"bodyweight","pattern":"horizontal_press","custom":false},{"id":"lib_8","name":"Back Squat","muscle":"Quads","equipment":"barbell","pattern":"squat","custom":false},{"id":"lib_9","name":"Front Squat","muscle":"Quads","equipment":"barbell","pattern":"squat","custom":false},{"id":"lib_10","name":"Goblet Squat","muscle":"Quads","equipment":"dumbbell","pattern":"squat","custom":false},{"id":"lib_11","name":"Leg Press","muscle":"Quads","equipment":"machine","pattern":"squat","custom":false},{"id":"lib_12","name":"Hack Squat","muscle":"Quads","equipment":"machine","pattern":"squat","custom":false},{"id":"lib_13","name":"Bulgarian Split Squat","muscle":"Quads","equipment":"dumbbell","pattern":"lunge","custom":false},{"id":"lib_14","name":"Walking Lunge","muscle":"Quads","equipment":"dumbbell","pattern":"lunge","custom":false},{"id":"lib_15","name":"Leg Extension","muscle":"Quads","equipment":"machine","pattern":"knee_extension","custom":false},{"id":"lib_16","name":"Deadlift","muscle":"Back","equipment":"barbell","pattern":"hinge","custom":false},{"id":"lib_17","name":"Romanian Deadlift","muscle":"Hamstrings","equipment":"barbell","pattern":"hinge","custom":false},{"id":"lib_18","name":"Dumbbell Romanian Deadlift","muscle":"Hamstrings","equipment":"dumbbell","pattern":"hinge","custom":false},{"id":"lib_19","name":"Seated Leg Curl","muscle":"Hamstrings","equipment":"machine","pattern":"knee_flexion","custom":false},{"id":"lib_20","name":"Lying Leg Curl","muscle":"Hamstrings","equipment":"machine","pattern":"knee_flexion","custom":false},{"id":"lib_21","name":"Good Morning","muscle":"Hamstrings","equipment":"barbell","pattern":"hinge","custom":false},{"id":"lib_22","name":"Hip Thrust","muscle":"Glutes","equipment":"barbell","pattern":"hip_extension","custom":false},{"id":"lib_23","name":"Glute Bridge","muscle":"Glutes","equipment":"bodyweight","pattern":"hip_extension","custom":false},{"id":"lib_24","name":"Cable Kickback","muscle":"Glutes","equipment":"cable","pattern":"hip_extension","custom":false},{"id":"lib_25","name":"Hip Abduction Machine","muscle":"Glutes","equipment":"machine","pattern":"hip_abduction","custom":false},{"id":"lib_26","name":"Barbell Row","muscle":"Back","equipment":"barbell","pattern":"horizontal_pull","custom":false},{"id":"lib_27","name":"Dumbbell Row","muscle":"Back","equipment":"dumbbell","pattern":"horizontal_pull","custom":false},{"id":"lib_28","name":"Seated Cable Row","muscle":"Back","equipment":"cable","pattern":"horizontal_pull","custom":false},{"id":"lib_29","name":"Chest Supported Row","muscle":"Back","equipment":"machine","pattern":"horizontal_pull","custom":false},{"id":"lib_30","name":"Lat Pulldown","muscle":"Back","equipment":"cable","pattern":"vertical_pull","custom":false},{"id":"lib_31","name":"Pull-Up","muscle":"Back","equipment":"bodyweight","pattern":"vertical_pull","custom":false},{"id":"lib_32","name":"Assisted Pull-Up","muscle":"Back","equipment":"machine","pattern":"vertical_pull","custom":false},{"id":"lib_33","name":"Straight Arm Pulldown","muscle":"Back","equipment":"cable","pattern":"shoulder_extension","custom":false},{"id":"lib_34","name":"Overhead Press","muscle":"Shoulders","equipment":"barbell","pattern":"vertical_press","custom":false},{"id":"lib_35","name":"Dumbbell Shoulder Press","muscle":"Shoulders","equipment":"dumbbell","pattern":"vertical_press","custom":false},{"id":"lib_36","name":"Machine Shoulder Press","muscle":"Shoulders","equipment":"machine","pattern":"vertical_press","custom":false},{"id":"lib_37","name":"Dumbbell Lateral Raise","muscle":"Shoulders","equipment":"dumbbell","pattern":"lateral_raise","custom":false},{"id":"lib_38","name":"Cable Lateral Raise","muscle":"Shoulders","equipment":"cable","pattern":"lateral_raise","custom":false},{"id":"lib_39","name":"Rear Delt Fly","muscle":"Shoulders","equipment":"machine","pattern":"rear_delt","custom":false},{"id":"lib_40","name":"Face Pull","muscle":"Shoulders","equipment":"cable","pattern":"rear_delt","custom":false},{"id":"lib_41","name":"Barbell Curl","muscle":"Biceps","equipment":"barbell","pattern":"elbow_flexion","custom":false},{"id":"lib_42","name":"Dumbbell Curl","muscle":"Biceps","equipment":"dumbbell","pattern":"elbow_flexion","custom":false},{"id":"lib_43","name":"Hammer Curl","muscle":"Biceps","equipment":"dumbbell","pattern":"elbow_flexion","custom":false},{"id":"lib_44","name":"Preacher Curl","muscle":"Biceps","equipment":"machine","pattern":"elbow_flexion","custom":false},{"id":"lib_45","name":"Cable Curl","muscle":"Biceps","equipment":"cable","pattern":"elbow_flexion","custom":false},{"id":"lib_46","name":"Triceps Pushdown","muscle":"Triceps","equipment":"cable","pattern":"elbow_extension","custom":false},{"id":"lib_47","name":"Overhead Triceps Extension","muscle":"Triceps","equipment":"cable","pattern":"elbow_extension","custom":false},{"id":"lib_48","name":"Skull Crusher","muscle":"Triceps","equipment":"barbell","pattern":"elbow_extension","custom":false},{"id":"lib_49","name":"Close Grip Bench Press","muscle":"Triceps","equipment":"barbell","pattern":"horizontal_press","custom":false},{"id":"lib_50","name":"Dip","muscle":"Triceps","equipment":"bodyweight","pattern":"dip_press","custom":false},{"id":"lib_51","name":"Standing Calf Raise","muscle":"Calves","equipment":"machine","pattern":"calf_raise","custom":false},{"id":"lib_52","name":"Seated Calf Raise","muscle":"Calves","equipment":"machine","pattern":"calf_raise","custom":false},{"id":"lib_53","name":"Leg Press Calf Raise","muscle":"Calves","equipment":"machine","pattern":"calf_raise","custom":false},{"id":"lib_54","name":"Cable Crunch","muscle":"Core","equipment":"cable","pattern":"spinal_flexion","custom":false},{"id":"lib_55","name":"Hanging Leg Raise","muscle":"Core","equipment":"bodyweight","pattern":"hip_flexion_core","custom":false},{"id":"lib_56","name":"Ab Wheel","muscle":"Core","equipment":"bodyweight","pattern":"anti_extension","custom":false},{"id":"lib_57","name":"Plank","muscle":"Core","equipment":"bodyweight","pattern":"anti_extension","custom":false},{"id":"lib_58","name":"Barbell Shrug","muscle":"Traps","equipment":"barbell","pattern":"shrug","custom":false},{"id":"lib_59","name":"Dumbbell Shrug","muscle":"Traps","equipment":"dumbbell","pattern":"shrug","custom":false},{"id":"lib_60","name":"Decline Barbell Bench Press","muscle":"Chest","equipment":"barbell","pattern":"horizontal_press","custom":false},{"id":"lib_61","name":"Floor Press","muscle":"Chest","equipment":"barbell","pattern":"horizontal_press","custom":false},{"id":"lib_62","name":"Paused Bench Press","muscle":"Chest","equipment":"barbell","pattern":"horizontal_press","custom":false},{"id":"lib_63","name":"Spoto Press","muscle":"Chest","equipment":"barbell","pattern":"horizontal_press","custom":false},{"id":"lib_64","name":"Board Press","muscle":"Chest","equipment":"barbell","pattern":"horizontal_press","custom":false},{"id":"lib_65","name":"Wide Grip Bench Press","muscle":"Chest","equipment":"barbell","pattern":"horizontal_press","custom":false},{"id":"lib_66","name":"Smith Machine Bench Press","muscle":"Chest","equipment":"smith machine","pattern":"horizontal_press","custom":false},{"id":"lib_67","name":"Smith Machine Decline Bench Press","muscle":"Chest","equipment":"smith machine","pattern":"horizontal_press","custom":false},{"id":"lib_68","name":"Smith Machine Incline Press","muscle":"Chest","equipment":"smith machine","pattern":"incline_press","custom":false},{"id":"lib_69","name":"Dumbbell Floor Press","muscle":"Chest","equipment":"dumbbell","pattern":"horizontal_press","custom":false},{"id":"lib_70","name":"Neutral Grip Dumbbell Bench Press","muscle":"Chest","equipment":"dumbbell","pattern":"horizontal_press","custom":false},{"id":"lib_71","name":"Single Arm Dumbbell Bench Press","muscle":"Chest","equipment":"dumbbell","pattern":"horizontal_press","custom":false},{"id":"lib_72","name":"Low Incline Dumbbell Press","muscle":"Chest","equipment":"dumbbell","pattern":"incline_press","custom":false},{"id":"lib_73","name":"Dumbbell Fly","muscle":"Chest","equipment":"dumbbell","pattern":"chest_fly","custom":false},{"id":"lib_74","name":"Incline Dumbbell Fly","muscle":"Chest","equipment":"dumbbell","pattern":"chest_fly","custom":false},{"id":"lib_75","name":"Standing Cable Chest Press","muscle":"Chest","equipment":"cable","pattern":"horizontal_press","custom":false},{"id":"lib_76","name":"Single Arm Cable Chest Press","muscle":"Chest","equipment":"cable","pattern":"horizontal_press","custom":false},{"id":"lib_77","name":"Low-to-High Cable Fly","muscle":"Chest","equipment":"cable","pattern":"chest_fly","custom":false},{"id":"lib_78","name":"High-to-Low Cable Fly","muscle":"Chest","equipment":"cable","pattern":"chest_fly","custom":false},{"id":"lib_79","name":"Single Arm Cable Fly","muscle":"Chest","equipment":"cable","pattern":"chest_fly","custom":false},{"id":"lib_80","name":"Plate Loaded Chest Press","muscle":"Chest","equipment":"machine","pattern":"horizontal_press","custom":false},{"id":"lib_81","name":"Iso-Lateral Chest Press","muscle":"Chest","equipment":"machine","pattern":"horizontal_press","custom":false},{"id":"lib_82","name":"Hammer Strength Chest Press","muscle":"Chest","equipment":"machine","pattern":"horizontal_press","custom":false},{"id":"lib_83","name":"Deficit Push-Up","muscle":"Chest","equipment":"bodyweight","pattern":"horizontal_press","custom":false},{"id":"lib_84","name":"Weighted Push-Up","muscle":"Chest","equipment":"bodyweight","pattern":"horizontal_press","custom":false},{"id":"lib_85","name":"Feet Elevated Push-Up","muscle":"Chest","equipment":"bodyweight","pattern":"horizontal_press","custom":false},{"id":"lib_86","name":"Pendlay Row","muscle":"Back","equipment":"barbell","pattern":"horizontal_pull","custom":false},{"id":"lib_87","name":"Yates Row","muscle":"Back","equipment":"barbell","pattern":"horizontal_pull","custom":false},{"id":"lib_88","name":"Underhand Barbell Row","muscle":"Back","equipment":"barbell","pattern":"horizontal_pull","custom":false},{"id":"lib_89","name":"Landmine Row","muscle":"Back","equipment":"barbell","pattern":"horizontal_pull","custom":false},{"id":"lib_90","name":"T-Bar Row","muscle":"Back","equipment":"barbell","pattern":"horizontal_pull","custom":false},{"id":"lib_91","name":"Chest Supported Dumbbell Row","muscle":"Back","equipment":"dumbbell","pattern":"horizontal_pull","custom":false},{"id":"lib_92","name":"Incline Bench Dumbbell Row","muscle":"Back","equipment":"dumbbell","pattern":"horizontal_pull","custom":false},{"id":"lib_93","name":"Renegade Row","muscle":"Back","equipment":"dumbbell","pattern":"horizontal_pull","custom":false},{"id":"lib_94","name":"Meadows Row","muscle":"Back","equipment":"dumbbell","pattern":"horizontal_pull","custom":false},{"id":"lib_95","name":"Wide Grip Seated Cable Row","muscle":"Back","equipment":"cable","pattern":"horizontal_pull","custom":false},{"id":"lib_96","name":"Close Grip Seated Cable Row","muscle":"Back","equipment":"cable","pattern":"horizontal_pull","custom":false},{"id":"lib_97","name":"Single Arm Cable Row","muscle":"Back","equipment":"cable","pattern":"horizontal_pull","custom":false},{"id":"lib_98","name":"Kneeling Cable Row","muscle":"Back","equipment":"cable","pattern":"horizontal_pull","custom":false},{"id":"lib_99","name":"High Cable Row","muscle":"Back","equipment":"cable","pattern":"horizontal_pull","custom":false},{"id":"lib_100","name":"Plate Loaded Row","muscle":"Back","equipment":"machine","pattern":"horizontal_pull","custom":false},{"id":"lib_101","name":"Iso-Lateral Row","muscle":"Back","equipment":"machine","pattern":"horizontal_pull","custom":false},{"id":"lib_102","name":"Hammer Strength Row","muscle":"Back","equipment":"machine","pattern":"horizontal_pull","custom":false},{"id":"lib_103","name":"Machine High Row","muscle":"Back","equipment":"machine","pattern":"horizontal_pull","custom":false},{"id":"lib_104","name":"Machine Low Row","muscle":"Back","equipment":"machine","pattern":"horizontal_pull","custom":false},{"id":"lib_105","name":"Wide Grip Lat Pulldown","muscle":"Back","equipment":"cable","pattern":"vertical_pull","custom":false},{"id":"lib_106","name":"Close Grip Lat Pulldown","muscle":"Back","equipment":"cable","pattern":"vertical_pull","custom":false},{"id":"lib_107","name":"Neutral Grip Lat Pulldown","muscle":"Back","equipment":"cable","pattern":"vertical_pull","custom":false},{"id":"lib_108","name":"Underhand Lat Pulldown","muscle":"Back","equipment":"cable","pattern":"vertical_pull","custom":false},{"id":"lib_109","name":"Single Arm Lat Pulldown","muscle":"Back","equipment":"cable","pattern":"vertical_pull","custom":false},{"id":"lib_110","name":"Kneeling Single Arm Pulldown","muscle":"Back","equipment":"cable","pattern":"vertical_pull","custom":false},{"id":"lib_111","name":"Plate Loaded Pulldown","muscle":"Back","equipment":"machine","pattern":"vertical_pull","custom":false},{"id":"lib_112","name":"Iso-Lateral Pulldown","muscle":"Back","equipment":"machine","pattern":"vertical_pull","custom":false},{"id":"lib_113","name":"Assisted Chin-Up","muscle":"Back","equipment":"machine","pattern":"vertical_pull","custom":false},{"id":"lib_114","name":"Chin-Up","muscle":"Back","equipment":"bodyweight","pattern":"vertical_pull","custom":false},{"id":"lib_115","name":"Neutral Grip Pull-Up","muscle":"Back","equipment":"bodyweight","pattern":"vertical_pull","custom":false},{"id":"lib_116","name":"Weighted Pull-Up","muscle":"Back","equipment":"bodyweight","pattern":"vertical_pull","custom":false},{"id":"lib_117","name":"Weighted Chin-Up","muscle":"Back","equipment":"bodyweight","pattern":"vertical_pull","custom":false},{"id":"lib_118","name":"Rope Straight Arm Pulldown","muscle":"Back","equipment":"cable","pattern":"shoulder_extension","custom":false},{"id":"lib_119","name":"Single Arm Straight Arm Pulldown","muscle":"Back","equipment":"cable","pattern":"shoulder_extension","custom":false},{"id":"lib_120","name":"Cable Pullover","muscle":"Back","equipment":"cable","pattern":"shoulder_extension","custom":false},{"id":"lib_121","name":"Dumbbell Pullover","muscle":"Back","equipment":"dumbbell","pattern":"pullover","custom":false},{"id":"lib_122","name":"Machine Pullover","muscle":"Back","equipment":"machine","pattern":"pullover","custom":false},{"id":"lib_123","name":"Push Press","muscle":"Shoulders","equipment":"barbell","pattern":"vertical_press","custom":false},{"id":"lib_124","name":"Behind-the-Neck Press","muscle":"Shoulders","equipment":"barbell","pattern":"vertical_press","custom":false},{"id":"lib_125","name":"Seated Barbell Shoulder Press","muscle":"Shoulders","equipment":"barbell","pattern":"vertical_press","custom":false},{"id":"lib_126","name":"Z Press","muscle":"Shoulders","equipment":"barbell","pattern":"vertical_press","custom":false},{"id":"lib_127","name":"Smith Machine Shoulder Press","muscle":"Shoulders","equipment":"smith machine","pattern":"vertical_press","custom":false},{"id":"lib_128","name":"Arnold Press","muscle":"Shoulders","equipment":"dumbbell","pattern":"vertical_press","custom":false},{"id":"lib_129","name":"Seated Dumbbell Shoulder Press","muscle":"Shoulders","equipment":"dumbbell","pattern":"vertical_press","custom":false},{"id":"lib_130","name":"Single Arm Dumbbell Shoulder Press","muscle":"Shoulders","equipment":"dumbbell","pattern":"vertical_press","custom":false},{"id":"lib_131","name":"Single Arm Cable Shoulder Press","muscle":"Shoulders","equipment":"cable","pattern":"vertical_press","custom":false},{"id":"lib_132","name":"Plate Loaded Shoulder Press","muscle":"Shoulders","equipment":"machine","pattern":"vertical_press","custom":false},{"id":"lib_133","name":"Iso-Lateral Shoulder Press","muscle":"Shoulders","equipment":"machine","pattern":"vertical_press","custom":false},{"id":"lib_134","name":"Lean-Away Dumbbell Lateral Raise","muscle":"Shoulders","equipment":"dumbbell","pattern":"lateral_raise","custom":false},{"id":"lib_135","name":"Seated Dumbbell Lateral Raise","muscle":"Shoulders","equipment":"dumbbell","pattern":"lateral_raise","custom":false},{"id":"lib_136","name":"Incline Dumbbell Lateral Raise","muscle":"Shoulders","equipment":"dumbbell","pattern":"lateral_raise","custom":false},{"id":"lib_137","name":"Behind-the-Back Cable Lateral Raise","muscle":"Shoulders","equipment":"cable","pattern":"lateral_raise","custom":false},{"id":"lib_138","name":"Lean-Away Cable Lateral Raise","muscle":"Shoulders","equipment":"cable","pattern":"lateral_raise","custom":false},{"id":"lib_139","name":"Machine Lateral Raise","muscle":"Shoulders","equipment":"machine","pattern":"lateral_raise","custom":false},{"id":"lib_140","name":"Bent Over Dumbbell Reverse Fly","muscle":"Shoulders","equipment":"dumbbell","pattern":"rear_delt","custom":false},{"id":"lib_141","name":"Incline Rear Delt Raise","muscle":"Shoulders","equipment":"dumbbell","pattern":"rear_delt","custom":false},{"id":"lib_142","name":"Cable Reverse Fly","muscle":"Shoulders","equipment":"cable","pattern":"rear_delt","custom":false},{"id":"lib_143","name":"Single Arm Rear Delt Cable Fly","muscle":"Shoulders","equipment":"cable","pattern":"rear_delt","custom":false},{"id":"lib_144","name":"Rope Face Pull","muscle":"Shoulders","equipment":"cable","pattern":"rear_delt","custom":false},{"id":"lib_145","name":"Reverse Pec Deck","muscle":"Shoulders","equipment":"machine","pattern":"rear_delt","custom":false},{"id":"lib_146","name":"Barbell Front Raise","muscle":"Shoulders","equipment":"barbell","pattern":"front_raise","custom":false},{"id":"lib_147","name":"Dumbbell Front Raise","muscle":"Shoulders","equipment":"dumbbell","pattern":"front_raise","custom":false},{"id":"lib_148","name":"Cable Front Raise","muscle":"Shoulders","equipment":"cable","pattern":"front_raise","custom":false},{"id":"lib_149","name":"Barbell Upright Row","muscle":"Shoulders","equipment":"barbell","pattern":"upright_row","custom":false},{"id":"lib_150","name":"Cable Upright Row","muscle":"Shoulders","equipment":"cable","pattern":"upright_row","custom":false},{"id":"lib_151","name":"High Bar Squat","muscle":"Quads","equipment":"barbell","pattern":"squat","custom":false},{"id":"lib_152","name":"Low Bar Squat","muscle":"Quads","equipment":"barbell","pattern":"squat","custom":false},{"id":"lib_153","name":"Pause Squat","muscle":"Quads","equipment":"barbell","pattern":"squat","custom":false},{"id":"lib_154","name":"Box Squat","muscle":"Quads","equipment":"barbell","pattern":"squat","custom":false},{"id":"lib_155","name":"Zercher Squat","muscle":"Quads","equipment":"barbell","pattern":"squat","custom":false},{"id":"lib_156","name":"Anderson Squat","muscle":"Quads","equipment":"barbell","pattern":"squat","custom":false},{"id":"lib_157","name":"Smith Machine Squat","muscle":"Quads","equipment":"smith machine","pattern":"squat","custom":false},{"id":"lib_158","name":"Smith Machine Hack Squat","muscle":"Quads","equipment":"smith machine","pattern":"squat","custom":false},{"id":"lib_159","name":"Pendulum Squat","muscle":"Quads","equipment":"machine","pattern":"squat","custom":false},{"id":"lib_160","name":"Belt Squat","muscle":"Quads","equipment":"machine","pattern":"squat","custom":false},{"id":"lib_161","name":"V-Squat","muscle":"Quads","equipment":"machine","pattern":"squat","custom":false},{"id":"lib_162","name":"Horizontal Leg Press","muscle":"Quads","equipment":"machine","pattern":"squat","custom":false},{"id":"lib_163","name":"Single Leg Press","muscle":"Quads","equipment":"machine","pattern":"squat","custom":false},{"id":"lib_164","name":"Reverse Lunge","muscle":"Quads","equipment":"dumbbell","pattern":"lunge","custom":false},{"id":"lib_165","name":"Stationary Lunge","muscle":"Quads","equipment":"dumbbell","pattern":"lunge","custom":false},{"id":"lib_166","name":"Front Foot Elevated Split Squat","muscle":"Quads","equipment":"dumbbell","pattern":"lunge","custom":false},{"id":"lib_167","name":"Step-Up","muscle":"Quads","equipment":"dumbbell","pattern":"lunge","custom":false},{"id":"lib_168","name":"Dumbbell Step-Up","muscle":"Quads","equipment":"dumbbell","pattern":"lunge","custom":false},{"id":"lib_169","name":"Barbell Reverse Lunge","muscle":"Quads","equipment":"barbell","pattern":"lunge","custom":false},{"id":"lib_170","name":"Barbell Split Squat","muscle":"Quads","equipment":"barbell","pattern":"lunge","custom":false},{"id":"lib_171","name":"Smith Machine Split Squat","muscle":"Quads","equipment":"smith machine","pattern":"lunge","custom":false},{"id":"lib_172","name":"Smith Machine Reverse Lunge","muscle":"Quads","equipment":"smith machine","pattern":"lunge","custom":false},{"id":"lib_173","name":"Single Leg Extension","muscle":"Quads","equipment":"machine","pattern":"knee_extension","custom":false},{"id":"lib_174","name":"Sled Push","muscle":"Quads","equipment":"sled","pattern":"sled_push","custom":false},{"id":"lib_175","name":"Stiff-Leg Deadlift","muscle":"Hamstrings","equipment":"barbell","pattern":"hinge","custom":false},{"id":"lib_176","name":"Snatch Grip Romanian Deadlift","muscle":"Hamstrings","equipment":"barbell","pattern":"hinge","custom":false},{"id":"lib_177","name":"Deficit Romanian Deadlift","muscle":"Hamstrings","equipment":"barbell","pattern":"hinge","custom":false},{"id":"lib_178","name":"Smith Machine Romanian Deadlift","muscle":"Hamstrings","equipment":"smith machine","pattern":"hinge","custom":false},{"id":"lib_179","name":"Cable Pull-Through","muscle":"Hamstrings","equipment":"cable","pattern":"hinge","custom":false},{"id":"lib_180","name":"Standing Leg Curl","muscle":"Hamstrings","equipment":"machine","pattern":"knee_flexion","custom":false},{"id":"lib_181","name":"Single Leg Seated Curl","muscle":"Hamstrings","equipment":"machine","pattern":"knee_flexion","custom":false},{"id":"lib_182","name":"Single Leg Lying Curl","muscle":"Hamstrings","equipment":"machine","pattern":"knee_flexion","custom":false},{"id":"lib_183","name":"Nordic Curl Machine","muscle":"Hamstrings","equipment":"machine","pattern":"knee_flexion","custom":false},{"id":"lib_184","name":"Nordic Hamstring Curl","muscle":"Hamstrings","equipment":"bodyweight","pattern":"knee_flexion","custom":false},{"id":"lib_185","name":"Sliding Leg Curl","muscle":"Hamstrings","equipment":"bodyweight","pattern":"knee_flexion","custom":false},{"id":"lib_186","name":"45-Degree Back Extension","muscle":"Hamstrings","equipment":"machine","pattern":"hinge","custom":false},{"id":"lib_187","name":"Glute Ham Raise","muscle":"Hamstrings","equipment":"machine","pattern":"hinge","custom":false},{"id":"lib_188","name":"Barbell Glute Bridge","muscle":"Glutes","equipment":"barbell","pattern":"hip_extension","custom":false},{"id":"lib_189","name":"B-Stance Hip Thrust","muscle":"Glutes","equipment":"barbell","pattern":"hip_extension","custom":false},{"id":"lib_190","name":"Smith Machine Hip Thrust","muscle":"Glutes","equipment":"smith machine","pattern":"hip_extension","custom":false},{"id":"lib_191","name":"Hip Thrust Machine","muscle":"Glutes","equipment":"machine","pattern":"hip_extension","custom":false},{"id":"lib_192","name":"Glute Drive Machine","muscle":"Glutes","equipment":"machine","pattern":"hip_extension","custom":false},{"id":"lib_193","name":"Reverse Hyperextension","muscle":"Glutes","equipment":"machine","pattern":"hip_extension","custom":false},{"id":"lib_194","name":"Standing Cable Hip Extension","muscle":"Glutes","equipment":"cable","pattern":"hip_extension","custom":false},{"id":"lib_195","name":"Standing Hip Abduction Machine","muscle":"Glutes","equipment":"machine","pattern":"hip_abduction","custom":false},{"id":"lib_196","name":"Cable Hip Abduction","muscle":"Glutes","equipment":"cable","pattern":"hip_abduction","custom":false},{"id":"lib_197","name":"Side-Lying Hip Abduction","muscle":"Glutes","equipment":"bodyweight","pattern":"hip_abduction","custom":false},{"id":"lib_198","name":"Banded Hip Abduction","muscle":"Glutes","equipment":"bodyweight","pattern":"hip_abduction","custom":false},{"id":"lib_199","name":"Hip Adduction Machine","muscle":"Adductors","equipment":"machine","pattern":"hip_adduction","custom":false},{"id":"lib_200","name":"Cable Hip Adduction","muscle":"Adductors","equipment":"cable","pattern":"hip_adduction","custom":false},{"id":"lib_201","name":"EZ-Bar Curl","muscle":"Biceps","equipment":"barbell","pattern":"elbow_flexion","custom":false},{"id":"lib_202","name":"Reverse Barbell Curl","muscle":"Biceps","equipment":"barbell","pattern":"elbow_flexion","custom":false},{"id":"lib_203","name":"Drag Curl","muscle":"Biceps","equipment":"barbell","pattern":"elbow_flexion","custom":false},{"id":"lib_204","name":"Spider Barbell Curl","muscle":"Biceps","equipment":"barbell","pattern":"elbow_flexion","custom":false},{"id":"lib_205","name":"Alternating Dumbbell Curl","muscle":"Biceps","equipment":"dumbbell","pattern":"elbow_flexion","custom":false},{"id":"lib_206","name":"Incline Dumbbell Curl","muscle":"Biceps","equipment":"dumbbell","pattern":"elbow_flexion","custom":false},{"id":"lib_207","name":"Concentration Curl","muscle":"Biceps","equipment":"dumbbell","pattern":"elbow_flexion","custom":false},{"id":"lib_208","name":"Spider Dumbbell Curl","muscle":"Biceps","equipment":"dumbbell","pattern":"elbow_flexion","custom":false},{"id":"lib_209","name":"Cross-Body Hammer Curl","muscle":"Biceps","equipment":"dumbbell","pattern":"elbow_flexion","custom":false},{"id":"lib_210","name":"Zottman Curl","muscle":"Biceps","equipment":"dumbbell","pattern":"elbow_flexion","custom":false},{"id":"lib_211","name":"Reverse Dumbbell Curl","muscle":"Biceps","equipment":"dumbbell","pattern":"elbow_flexion","custom":false},{"id":"lib_212","name":"Rope Hammer Curl","muscle":"Biceps","equipment":"cable","pattern":"elbow_flexion","custom":false},{"id":"lib_213","name":"Bayesian Cable Curl","muscle":"Biceps","equipment":"cable","pattern":"elbow_flexion","custom":false},{"id":"lib_214","name":"High Cable Curl","muscle":"Biceps","equipment":"cable","pattern":"elbow_flexion","custom":false},{"id":"lib_215","name":"Single Arm Cable Curl","muscle":"Biceps","equipment":"cable","pattern":"elbow_flexion","custom":false},{"id":"lib_216","name":"Cable Preacher Curl","muscle":"Biceps","equipment":"cable","pattern":"elbow_flexion","custom":false},{"id":"lib_217","name":"Machine Biceps Curl","muscle":"Biceps","equipment":"machine","pattern":"elbow_flexion","custom":false},{"id":"lib_218","name":"Plate Loaded Preacher Curl","muscle":"Biceps","equipment":"machine","pattern":"elbow_flexion","custom":false},{"id":"lib_219","name":"Rope Triceps Pushdown","muscle":"Triceps","equipment":"cable","pattern":"elbow_extension","custom":false},{"id":"lib_220","name":"Straight Bar Pushdown","muscle":"Triceps","equipment":"cable","pattern":"elbow_extension","custom":false},{"id":"lib_221","name":"V-Bar Pushdown","muscle":"Triceps","equipment":"cable","pattern":"elbow_extension","custom":false},{"id":"lib_222","name":"Single Arm Triceps Pushdown","muscle":"Triceps","equipment":"cable","pattern":"elbow_extension","custom":false},{"id":"lib_223","name":"Cross-Body Cable Triceps Extension","muscle":"Triceps","equipment":"cable","pattern":"elbow_extension","custom":false},{"id":"lib_224","name":"Rope Overhead Triceps Extension","muscle":"Triceps","equipment":"cable","pattern":"elbow_extension","custom":false},{"id":"lib_225","name":"Single Arm Overhead Cable Extension","muscle":"Triceps","equipment":"cable","pattern":"elbow_extension","custom":false},{"id":"lib_226","name":"EZ-Bar Skull Crusher","muscle":"Triceps","equipment":"barbell","pattern":"elbow_extension","custom":false},{"id":"lib_227","name":"JM Press","muscle":"Triceps","equipment":"barbell","pattern":"elbow_extension","custom":false},{"id":"lib_228","name":"Dumbbell Skull Crusher","muscle":"Triceps","equipment":"dumbbell","pattern":"elbow_extension","custom":false},{"id":"lib_229","name":"Single Dumbbell Overhead Extension","muscle":"Triceps","equipment":"dumbbell","pattern":"elbow_extension","custom":false},{"id":"lib_230","name":"Dumbbell Tate Press","muscle":"Triceps","equipment":"dumbbell","pattern":"elbow_extension","custom":false},{"id":"lib_231","name":"Dumbbell Kickback","muscle":"Triceps","equipment":"dumbbell","pattern":"elbow_extension","custom":false},{"id":"lib_232","name":"Machine Triceps Extension","muscle":"Triceps","equipment":"machine","pattern":"elbow_extension","custom":false},{"id":"lib_233","name":"Assisted Dip","muscle":"Triceps","equipment":"machine","pattern":"elbow_extension","custom":false},{"id":"lib_234","name":"Plate Loaded Dip","muscle":"Triceps","equipment":"machine","pattern":"elbow_extension","custom":false},{"id":"lib_235","name":"Bench Dip","muscle":"Triceps","equipment":"bodyweight","pattern":"elbow_extension","custom":false},{"id":"lib_236","name":"Diamond Push-Up","muscle":"Triceps","equipment":"bodyweight","pattern":"elbow_extension","custom":false},{"id":"lib_237","name":"Donkey Calf Raise","muscle":"Calves","equipment":"machine","pattern":"calf_raise","custom":false},{"id":"lib_238","name":"Single Leg Standing Calf Raise","muscle":"Calves","equipment":"machine","pattern":"calf_raise","custom":false},{"id":"lib_239","name":"Hack Squat Calf Raise","muscle":"Calves","equipment":"machine","pattern":"calf_raise","custom":false},{"id":"lib_240","name":"Smith Machine Calf Raise","muscle":"Calves","equipment":"smith machine","pattern":"calf_raise","custom":false},{"id":"lib_241","name":"Dumbbell Standing Calf Raise","muscle":"Calves","equipment":"dumbbell","pattern":"calf_raise","custom":false},{"id":"lib_242","name":"Single Leg Dumbbell Calf Raise","muscle":"Calves","equipment":"dumbbell","pattern":"calf_raise","custom":false},{"id":"lib_243","name":"Single Leg Calf Raise","muscle":"Calves","equipment":"bodyweight","pattern":"calf_raise","custom":false},{"id":"lib_244","name":"Tibialis Raise Machine","muscle":"Tibialis","equipment":"machine","pattern":"dorsiflexion","custom":false},{"id":"lib_245","name":"Wall Tibialis Raise","muscle":"Tibialis","equipment":"bodyweight","pattern":"dorsiflexion","custom":false},{"id":"lib_246","name":"Behind-the-Back Barbell Shrug","muscle":"Traps","equipment":"barbell","pattern":"shrug","custom":false},{"id":"lib_247","name":"Snatch Grip Shrug","muscle":"Traps","equipment":"barbell","pattern":"shrug","custom":false},{"id":"lib_248","name":"Smith Machine Shrug","muscle":"Traps","equipment":"smith machine","pattern":"shrug","custom":false},{"id":"lib_249","name":"Machine Shrug","muscle":"Traps","equipment":"machine","pattern":"shrug","custom":false},{"id":"lib_250","name":"Cable Shrug","muscle":"Traps","equipment":"cable","pattern":"shrug","custom":false},{"id":"lib_251","name":"Incline Dumbbell Shrug","muscle":"Traps","equipment":"dumbbell","pattern":"shrug","custom":false},{"id":"lib_252","name":"Barbell Wrist Curl","muscle":"Forearms","equipment":"barbell","pattern":"wrist_flexion","custom":false},{"id":"lib_253","name":"Behind-the-Back Wrist Curl","muscle":"Forearms","equipment":"barbell","pattern":"wrist_flexion","custom":false},{"id":"lib_254","name":"Barbell Reverse Wrist Curl","muscle":"Forearms","equipment":"barbell","pattern":"wrist_extension","custom":false},{"id":"lib_255","name":"Dumbbell Wrist Curl","muscle":"Forearms","equipment":"dumbbell","pattern":"wrist_flexion","custom":false},{"id":"lib_256","name":"Dumbbell Reverse Wrist Curl","muscle":"Forearms","equipment":"dumbbell","pattern":"wrist_extension","custom":false},{"id":"lib_257","name":"Cable Wrist Curl","muscle":"Forearms","equipment":"cable","pattern":"wrist_flexion","custom":false},{"id":"lib_258","name":"Dumbbell Farmer Carry","muscle":"Forearms","equipment":"dumbbell","pattern":"grip","custom":false},{"id":"lib_259","name":"Trap Bar Farmer Carry","muscle":"Forearms","equipment":"trap bar","pattern":"grip","custom":false},{"id":"lib_260","name":"Plate Pinch Carry","muscle":"Forearms","equipment":"plate","pattern":"grip","custom":false},{"id":"lib_261","name":"Kneeling Cable Crunch","muscle":"Core","equipment":"cable","pattern":"spinal_flexion","custom":false},{"id":"lib_262","name":"Standing Cable Crunch","muscle":"Core","equipment":"cable","pattern":"spinal_flexion","custom":false},{"id":"lib_263","name":"Ab Crunch Machine","muscle":"Core","equipment":"machine","pattern":"spinal_flexion","custom":false},{"id":"lib_264","name":"Crunch","muscle":"Core","equipment":"bodyweight","pattern":"spinal_flexion","custom":false},{"id":"lib_265","name":"Decline Crunch","muscle":"Core","equipment":"bodyweight","pattern":"spinal_flexion","custom":false},{"id":"lib_266","name":"Sit-Up","muscle":"Core","equipment":"bodyweight","pattern":"spinal_flexion","custom":false},{"id":"lib_267","name":"Captain Chair Leg Raise","muscle":"Core","equipment":"bodyweight","pattern":"hip_flexion_core","custom":false},{"id":"lib_268","name":"Lying Leg Raise","muscle":"Core","equipment":"bodyweight","pattern":"hip_flexion_core","custom":false},{"id":"lib_269","name":"Reverse Crunch","muscle":"Core","equipment":"bodyweight","pattern":"hip_flexion_core","custom":false},{"id":"lib_270","name":"Hanging Knee Raise","muscle":"Core","equipment":"bodyweight","pattern":"hip_flexion_core","custom":false},{"id":"lib_271","name":"Cable Woodchop","muscle":"Core","equipment":"cable","pattern":"rotation","custom":false},{"id":"lib_272","name":"Cable Rotation","muscle":"Core","equipment":"cable","pattern":"rotation","custom":false},{"id":"lib_273","name":"Pallof Press","muscle":"Core","equipment":"cable","pattern":"anti_rotation","custom":false},{"id":"lib_274","name":"Body Saw Plank","muscle":"Core","equipment":"bodyweight","pattern":"anti_extension","custom":false},{"id":"lib_275","name":"RKC Plank","muscle":"Core","equipment":"bodyweight","pattern":"anti_extension","custom":false},{"id":"lib_276","name":"Dead Bug","muscle":"Core","equipment":"bodyweight","pattern":"anti_extension","custom":false},{"id":"lib_277","name":"Dumbbell Side Bend","muscle":"Core","equipment":"dumbbell","pattern":"lateral_flexion","custom":false},{"id":"lib_278","name":"Cable Side Bend","muscle":"Core","equipment":"cable","pattern":"lateral_flexion","custom":false},{"id":"lib_279","name":"Side Plank","muscle":"Core","equipment":"bodyweight","pattern":"lateral_flexion","custom":false},{"id":"lib_280","name":"Rack Pull","muscle":"Lower Back","equipment":"barbell","pattern":"hinge","custom":false},{"id":"lib_281","name":"Block Pull","muscle":"Lower Back","equipment":"barbell","pattern":"hinge","custom":false},{"id":"lib_282","name":"Deficit Deadlift","muscle":"Lower Back","equipment":"barbell","pattern":"hinge","custom":false},{"id":"lib_283","name":"Sumo Deadlift","muscle":"Lower Back","equipment":"barbell","pattern":"hinge","custom":false},{"id":"lib_284","name":"Trap Bar Deadlift","muscle":"Lower Back","equipment":"trap bar","pattern":"hinge","custom":false},{"id":"lib_285","name":"Roman Chair Back Extension","muscle":"Lower Back","equipment":"machine","pattern":"back_extension","custom":false},{"id":"lib_286","name":"Seated Back Extension Machine","muscle":"Lower Back","equipment":"machine","pattern":"back_extension","custom":false},{"id":"lib_287","name":"Power Clean","muscle":"Full Body","equipment":"barbell","pattern":"olympic_pull","custom":false},{"id":"lib_288","name":"Hang Power Clean","muscle":"Full Body","equipment":"barbell","pattern":"olympic_pull","custom":false},{"id":"lib_289","name":"Clean Pull","muscle":"Full Body","equipment":"barbell","pattern":"olympic_pull","custom":false},{"id":"lib_290","name":"High Pull","muscle":"Full Body","equipment":"barbell","pattern":"olympic_pull","custom":false},{"id":"lib_291","name":"Power Snatch","muscle":"Full Body","equipment":"barbell","pattern":"olympic_pull","custom":false},{"id":"lib_292","name":"Hang Power Snatch","muscle":"Full Body","equipment":"barbell","pattern":"olympic_pull","custom":false},{"id":"lib_293","name":"Kettlebell Swing","muscle":"Full Body","equipment":"kettlebell","pattern":"hinge","custom":false},{"id":"lib_294","name":"Kettlebell Romanian Deadlift","muscle":"Full Body","equipment":"kettlebell","pattern":"hinge","custom":false},{"id":"lib_295","name":"Kettlebell Goblet Squat","muscle":"Full Body","equipment":"kettlebell","pattern":"squat","custom":false},{"id":"lib_296","name":"Double Kettlebell Front Squat","muscle":"Full Body","equipment":"kettlebell","pattern":"squat","custom":false},{"id":"lib_297","name":"Kettlebell Press","muscle":"Full Body","equipment":"kettlebell","pattern":"vertical_press","custom":false},{"id":"lib_298","name":"Double Kettlebell Press","muscle":"Full Body","equipment":"kettlebell","pattern":"vertical_press","custom":false},{"id":"lib_299","name":"Kettlebell Farmer Carry","muscle":"Full Body","equipment":"kettlebell","pattern":"carry","custom":false},{"id":"lib_300","name":"Kettlebell Suitcase Carry","muscle":"Full Body","equipment":"kettlebell","pattern":"carry","custom":false},{"id":"lib_301","name":"Landmine Press","muscle":"Full Body","equipment":"landmine","pattern":"vertical_press","custom":false},{"id":"lib_302","name":"Half-Kneeling Landmine Press","muscle":"Full Body","equipment":"landmine","pattern":"vertical_press","custom":false},{"id":"lib_303","name":"Landmine Squat","muscle":"Full Body","equipment":"landmine","pattern":"squat","custom":false},{"id":"lib_304","name":"Landmine Reverse Lunge","muscle":"Full Body","equipment":"landmine","pattern":"lunge","custom":false},{"id":"lib_305","name":"Backward Sled Drag","muscle":"Full Body","equipment":"sled","pattern":"sled_pull","custom":false},{"id":"lib_306","name":"Sled Drag","muscle":"Full Body","equipment":"sled","pattern":"sled_pull","custom":false}];

function freshState(){
 return {
   schemaVersion:DATA_SCHEMA_VERSION,
   meta:{lastBackupAt:null,lastSavedAt:null,lastMigrationAt:null},
   profile:{name:'',unit:'lb'},
   customExercises:[],
   routines:[],
   programs:[],
   activeProgramId:null,
   sessions:[],
   activeWorkout:null,
   favorites:[],
   exercisePreferences:{},
   bodyweight:[],
   ui:{onboardingDone:false,haptics:true,keepAwake:true},
   settings:{defaultMin:8,defaultMax:12,defaultSets:3,defaultIncrement:5,coachAliases:{}}
 };
}
function isPlainObject(v){return !!v&&typeof v==='object'&&!Array.isArray(v)}
function cloneData(v){return JSON.parse(JSON.stringify(v))}
function migrateState(saved){
 if(!isPlainObject(saved))throw new Error('Workout data is not a valid object.');
 const out=cloneData(saved);
 const rawVersion=out.schemaVersion==null?0:Number(out.schemaVersion);
 if(!Number.isInteger(rawVersion)||rawVersion<0)throw new Error('Workout data has an invalid schema version.');
 if(rawVersion>DATA_SCHEMA_VERSION)throw new Error(`This data was created by a newer Swole Cat data format (v${rawVersion}). Update the app before opening it.`);
 let version=rawVersion;
 if(version<1){
   out.schemaVersion=1;
   out.meta=isPlainObject(out.meta)?out.meta:{};
   out.meta.lastMigrationAt=new Date().toISOString();
   version=1;
 }
 out.schemaVersion=DATA_SCHEMA_VERSION;
 return out;
}
function validateStateShape(saved){
 if(!isPlainObject(saved))throw new Error('Backup does not contain a Swole Cat data object.');
 const arrayKeys=['customExercises','routines','programs','sessions','favorites','bodyweight'];
 for(const key of arrayKeys){
   if(saved[key]!=null&&!Array.isArray(saved[key]))throw new Error(`Backup field "${key}" is invalid.`);
 }
 if(saved.profile!=null&&!isPlainObject(saved.profile))throw new Error('Backup profile is invalid.');
 if(saved.settings!=null&&!isPlainObject(saved.settings))throw new Error('Backup settings are invalid.');
 if(saved.ui!=null&&!isPlainObject(saved.ui))throw new Error('Backup UI settings are invalid.');
 if(saved.exercisePreferences!=null&&!isPlainObject(saved.exercisePreferences))throw new Error('Backup exercise preferences are invalid.');
 const recognized=['profile','routines','sessions','settings','customExercises','ui','schemaVersion'];
 if(!recognized.some(k=>Object.prototype.hasOwnProperty.call(saved,k)))throw new Error('This file does not look like a Swole Cat backup.');
 return true;
}
function normalizeState(saved){
 validateStateShape(saved);
 saved=migrateState(saved);
 const base=freshState(),merged=Object.assign(base,saved);
 merged.schemaVersion=DATA_SCHEMA_VERSION;
 merged.meta=Object.assign(base.meta,isPlainObject(saved.meta)?saved.meta:{});
 merged.profile=Object.assign(base.profile,isPlainObject(saved.profile)?saved.profile:{});
 merged.settings=Object.assign(base.settings,isPlainObject(saved.settings)?saved.settings:{});
 merged.settings.coachAliases=isPlainObject(merged.settings.coachAliases)?merged.settings.coachAliases:{};
 merged.ui=Object.assign(base.ui,isPlainObject(saved.ui)?saved.ui:{});
 merged.customExercises=Array.isArray(saved.customExercises)?saved.customExercises:[];
 merged.routines=Array.isArray(saved.routines)?saved.routines:[];
 merged.sessions=Array.isArray(saved.sessions)?saved.sessions:[];
 merged.favorites=Array.isArray(saved.favorites)?saved.favorites:[];
 merged.bodyweight=Array.isArray(saved.bodyweight)?saved.bodyweight:[];
 merged.exercisePreferences=isPlainObject(saved.exercisePreferences)?saved.exercisePreferences:{};
 Object.keys(merged.exercisePreferences).forEach(id=>{
   const v=merged.exercisePreferences[id];
   if(!['prefer','avoid','hide'].includes(v))delete merged.exercisePreferences[id];
 });
 merged.programs=Array.isArray(saved.programs)?saved.programs:[];
 merged.activeProgramId=saved.activeProgramId||null;
 merged.routines.forEach(r=>{if(!Array.isArray(r.exercises))r.exercises=[];r.trainingMode=normalizeTrainingMode(r.trainingMode);r.description=typeof r.description==='string'?r.description:'';r.archivedAt=typeof r.archivedAt==='string'&&r.archivedAt?r.archivedAt:null});
 merged.programs.forEach(p=>{
   p.trainingMode=normalizeProgramTrainingMode(p.trainingMode);
   p.routineIds=Array.isArray(p.routineIds)?p.routineIds.filter(id=>merged.routines.some(r=>r.id===id)):[];
   p.frequency=Math.min(7,Math.max(1,Number(p.frequency)||3));
   p.preferredDays=Array.isArray(p.preferredDays)?p.preferredDays.filter(d=>Number.isInteger(d)&&d>=0&&d<=6):[];
   p.nextIndex=Math.max(0,Math.min(Math.max(0,p.routineIds.length-1),Number(p.nextIndex)||0));
 });
 if(merged.activeProgramId&&!merged.programs.some(p=>p.id===merged.activeProgramId))merged.activeProgramId=null;
 if((merged.routines?.length||0)||(merged.sessions?.length||0))merged.ui.onboardingDone=true;
 merged.sessions.forEach(session=>{
   if(!Array.isArray(session.exercises))session.exercises=[];
   session.exercises.forEach(e=>{
     if(!Array.isArray(e.sets))e.sets=[];
     e.sets.forEach(set=>{set.type=set.type||'working'});
   });
 });
 if(merged.activeWorkout){
   if(!isPlainObject(merged.activeWorkout))merged.activeWorkout=null;
   else{
     merged.activeWorkout.status='active';
     merged.activeWorkout.lastSavedAt=merged.activeWorkout.lastSavedAt||merged.activeWorkout.startDate||new Date().toISOString();
     merged.activeWorkout.structureDirty=!!merged.activeWorkout.structureDirty;
     merged.activeWorkout.trainingMode=normalizeTrainingMode(merged.activeWorkout.trainingMode);
     merged.activeWorkout.pausedDurationMs=Math.max(0,Number(merged.activeWorkout.pausedDurationMs)||0);
     merged.activeWorkout.pausedAt=typeof merged.activeWorkout.pausedAt==='string'&&merged.activeWorkout.pausedAt?merged.activeWorkout.pausedAt:null;
     if(!Array.isArray(merged.activeWorkout.exercises))merged.activeWorkout.exercises=[];
     merged.activeWorkout.exercises.forEach(e=>{
       e.supersetId=e.supersetId||null;
       e.config=isPlainObject(e.config)?e.config:{};
       e.config.routineMode=normalizeTrainingMode(e.config.routineMode||merged.activeWorkout.trainingMode);
       e.skipped=!!e.skipped;
       if(!Array.isArray(e.sets))e.sets=[];
       e.sets.forEach(set=>{set.type=set.type||'working'});
     });
   }
 }
 return merged;
}
function writeRecoverySnapshot(raw){
 if(recoverySnapshotWritten||!raw||raw.length>MAX_RECOVERY_SNAPSHOT_CHARS)return false;
 try{
   swoleCatStorage.setItem(RECOVERYKEY,JSON.stringify({savedAt:new Date().toISOString(),raw}));
   recoverySnapshotWritten=true;
   return true;
 }catch(e){return false}
}
function readRecoverySnapshot(){
 try{
   const box=JSON.parse(swoleCatStorage.getItem(RECOVERYKEY)||'null');
   if(!box||typeof box.raw!=='string')return null;
   return {savedAt:box.savedAt||null,state:normalizeState(JSON.parse(box.raw))};
 }catch(e){return null}
}
function load(){
 let raw='';
 try{raw=swoleCatStorage.getItem(LSKEY)||''}
 catch(e){
   storageWriteBlocked=true;
   lastStorageError=e?.message||String(e);
   startupStorageNotice='Swole Cat cannot access local device storage in this browser session. Your data has not been changed. Check browser storage/privacy settings before logging more workouts.';
   return freshState();
 }
 if(!raw)return freshState();
 try{
   const normalized=normalizeState(JSON.parse(raw));
   writeRecoverySnapshot(raw);
   return normalized;
 }catch(primaryError){
   const message=primaryError?.message||String(primaryError);
   if(message.includes('newer Swole Cat data format')){
     storageWriteBlocked=true;
     startupStorageNotice=message+' The existing local data has been left untouched.';
     lastStorageError=message;
     return freshState();
   }
   const recovered=readRecoverySnapshot();
   if(recovered){
     recoveredFromSnapshot=true;
     recoverySnapshotWritten=true;
     startupStorageNotice=`Swole Cat recovered your workout data from a last-known-good device snapshot${recovered.savedAt?` from ${new Date(recovered.savedAt).toLocaleString()}`:''}. Review your recent history, then export a backup.`;
     return recovered.state;
   }
   storageWriteBlocked=true;
   startupStorageNotice='Swole Cat could not safely read the local workout data on this device. The unreadable data has not been overwritten. Import a backup or explicitly erase the unreadable data to start fresh.';
   lastStorageError=message;
   return freshState();
 }
}
let state=load();
let stateRevision=0,pendingStateSave=false,pendingStateSaveTimer=null;
SwoleCatRuntime.registerService('state',{
 read(){return cloneData(state)},
 revision(){return stateRevision},
 requestSave(){return save()}
});
const navigationRenderRevision={home:-1,routines:-1,exercises:-1,history:-1,analytics:-1};
let derivedSessionCacheRevision=-1,derivedSessionCache=null;
let exerciseCatalogCacheRevision=-1,exerciseCatalogCache=null;
let navigationRefreshFrame=null;
function derivedSessionData(){
 if(derivedSessionCache&&derivedSessionCacheRevision===stateRevision)return derivedSessionCache;
 const sessionsByDate=new Map(),historyByExercise=new Map(),previousByExercise=new Map(),loggedExerciseIds=new Set();
 state.sessions.forEach(session=>{
   const dateKey=localDateKey(session.date);
   if(dateKey){
     if(!sessionsByDate.has(dateKey))sessionsByDate.set(dateKey,[]);
     sessionsByDate.get(dateKey).push(session);
   }
   (session.exercises||[]).forEach(e=>{
     const working=progressionSets(e),all=completedSets(e);
     if(all.length)loggedExerciseIds.add(e.exerciseId);
     const previous=previousByExercise.get(e.exerciseId);
     if(!previous||String(session.date).localeCompare(String(previous.date))>0)previousByExercise.set(e.exerciseId,{date:session.date,...e});
     if(!working.length)return;
     if(!historyByExercise.has(e.exerciseId))historyByExercise.set(e.exerciseId,[]);
     historyByExercise.get(e.exerciseId).push({date:session.date,routineName:session.routineName,sets:working,allSets:all,notes:e.notes||''});
   });
 });
 historyByExercise.forEach(rows=>rows.sort((a,b)=>a.date.localeCompare(b.date)));
 derivedSessionCache={sessionsByDate,historyByExercise,previousByExercise,loggedExerciseIds};
 derivedSessionCacheRevision=stateRevision;
 return derivedSessionCache;
}
function exerciseCatalog(){
 if(exerciseCatalogCache&&exerciseCatalogCacheRevision===stateRevision)return exerciseCatalogCache;
 const list=[...LIBRARY,...state.customExercises],byId=new Map(list.map(ex=>[ex.id,ex]));
 exerciseCatalogCache={list,byId};
 exerciseCatalogCacheRevision=stateRevision;
 return exerciseCatalogCache;
}
function queueNavigationRefresh(id){
 if(!Object.prototype.hasOwnProperty.call(navigationRenderRevision,id))return;
 if(navigationRenderRevision[id]===stateRevision)return;
 if(navigationRefreshFrame)cancelAnimationFrame(navigationRefreshFrame);
 navigationRefreshFrame=requestAnimationFrame(()=>{
   navigationRefreshFrame=null;
   if(activeViewId()===id)renderNavigationView(id);
 });
}
function scheduleStateSave(delay=220){
 if(storageWriteBlocked)return false;
 pendingStateSave=true;
 if(pendingStateSaveTimer)clearTimeout(pendingStateSaveTimer);
 pendingStateSaveTimer=setTimeout(()=>flushPendingStateSave(),delay);
 return true;
}
function flushPendingStateSave(){
 if(pendingStateSaveTimer){clearTimeout(pendingStateSaveTimer);pendingStateSaveTimer=null}
 if(!pendingStateSave)return true;
 pendingStateSave=false;
 return save();
}
function renderNavigationView(id){
 if(!Object.prototype.hasOwnProperty.call(navigationRenderRevision,id))return;
 if(navigationRenderRevision[id]===stateRevision)return;
 if(id==='home')renderHome();
 if(id==='routines')renderRoutines();
 if(id==='exercises')renderExercises();
 if(id==='history')renderHistory();
 if(id==='analytics')renderAnalytics();
 navigationRenderRevision[id]=stateRevision;
}
function invalidateNavigationView(id){
 if(Object.prototype.hasOwnProperty.call(navigationRenderRevision,id))navigationRenderRevision[id]=-1;
}

function save(){
 if(storageWriteBlocked)return false;
 if(pendingStateSaveTimer){clearTimeout(pendingStateSaveTimer);pendingStateSaveTimer=null}
 pendingStateSave=false;
 try{
   if(!recoverySnapshotWritten){
     const previous=swoleCatStorage.getItem(LSKEY);
     if(previous)writeRecoverySnapshot(previous);
   }
   state.schemaVersion=DATA_SCHEMA_VERSION;
   state.meta=isPlainObject(state.meta)?state.meta:{};
   state.meta.lastSavedAt=new Date().toISOString();
   const serialized=JSON.stringify(state);
   swoleCatStorage.setItem(LSKEY,serialized);
   stateRevision++;
   lastStorageError='';
   SwoleCatRuntime.events.dispatchEvent(new CustomEvent('state:saved',{detail:{revision:stateRevision,savedAt:state.meta.lastSavedAt}}));
   return true;
 }catch(e){
   lastStorageError=e?.message||String(e);
   try{showToast('Could not save locally');}catch(_){}
   return false;
 }
}
function parseBackupText(text){
 let parsed;
 try{parsed=JSON.parse(text)}catch(e){throw new Error('The selected file is not valid JSON.')}
 let payload=parsed;
 if(isPlainObject(parsed)&&Object.prototype.hasOwnProperty.call(parsed,'format')){
   if(parsed.format!==BACKUP_FORMAT)throw new Error('This is not a Swole Cat backup.');
   if(Number(parsed.formatVersion||1)>BACKUP_FORMAT_VERSION)throw new Error('This backup format is newer than this version of Swole Cat.');
   payload=parsed.state;
 }
 return normalizeState(payload);
}
function createBackupEnvelope(exportedAt=new Date().toISOString()){
 state.schemaVersion=DATA_SCHEMA_VERSION;
 state.meta=isPlainObject(state.meta)?state.meta:{};
 state.meta.lastBackupAt=exportedAt;
 save();
 return {format:BACKUP_FORMAT,formatVersion:BACKUP_FORMAT_VERSION,exportedAt,schemaVersion:DATA_SCHEMA_VERSION,state:cloneData(state)};
}
function createPreImportSnapshot(){
 try{
   const raw=swoleCatStorage.getItem(LSKEY);
   if(!raw)return true;
   swoleCatStorage.setItem(IMPORTSNAPSHOTKEY,JSON.stringify({savedAt:new Date().toISOString(),raw}));
   return true;
 }catch(e){
   lastStorageError=e?.message||String(e);
   return false;
 }
}
function preImportSnapshotInfo(){
 try{
   const box=JSON.parse(swoleCatStorage.getItem(IMPORTSNAPSHOTKEY)||'null');
   return box&&typeof box.raw==='string'?box:null;
 }catch(e){return null}
}
function restorePreImportSnapshot(){
 const box=preImportSnapshotInfo();
 if(!box){showToast('No pre-import snapshot available');return}
 confirmAction('Restore pre-import snapshot?',`This restores the local Swole Cat data saved before your last successful import${box.savedAt?` on ${new Date(box.savedAt).toLocaleString()}`:''}. Your current local state will be replaced.`,()=>{
   try{
     const restored=normalizeState(JSON.parse(box.raw));
     const current=state;
     state=restored;storageWriteBlocked=false;
     if(!save()){state=current;throw new Error(lastStorageError||'Local storage write failed.')}
     closeModal();renderHome();showToast('Pre-import snapshot restored');
   }catch(e){alert('Could not restore that snapshot: '+(e?.message||e))}
 });
}
function storageHealthText(){
 if(storageWriteBlocked)return 'Write protection active · unreadable local data preserved';
 if(lastStorageError)return 'Last local save failed: '+lastStorageError;
 return 'Local storage writable';
}
function clearUnreadableLocalData(){
 confirmAction('Erase unreadable local data?','Only use this if you do not have a backup you want to restore. The unreadable local Swole Cat record will be permanently replaced with a fresh empty state.',()=>{
   try{
     swoleCatStorage.removeItem(LSKEY);
     swoleCatStorage.removeItem(RECOVERYKEY);
     swoleCatStorage.removeItem(IMPORTSNAPSHOTKEY);
   }catch(e){}
   storageWriteBlocked=false;recoveredFromSnapshot=false;startupStorageNotice='';lastStorageError='';recoverySnapshotWritten=false;
   state=freshState();save();renderHome();populateMuscles();updateActiveWorkoutChrome();showToast('Started with fresh local data');setTimeout(onboarding,180);
 });
}
function openStartupStorageNotice(){
 if(!startupStorageNotice)return;
 if(storageWriteBlocked){
   openModal('Local data needs attention',`
     <div class="notice"><b>Swole Cat stopped before overwriting anything.</b><br><br>${esc(startupStorageNotice)}${lastStorageError?`<br><br><span class="mini">Details: ${esc(lastStorageError)}</span>`:''}</div>
     <div class="actions">
       <label class="btn" style="display:inline-block;margin:0">Import backup<input type="file" accept=".json,application/json" onchange="importBackup(this.files[0],this)" style="display:none"></label>
       <button class="btn secondary" onclick="closeModal();openSettings()">Open data safety</button>
       <button class="btn danger" onclick="clearUnreadableLocalData()">Erase & start fresh</button>
     </div>
   `);
 }else if(recoveredFromSnapshot){
   openModal('Workout data recovered',`
     <div class="notice">${esc(startupStorageNotice)}</div>
     <div class="actions"><button class="btn" onclick="exportBackup();closeModal()">Export a backup now</button><button class="btn secondary" onclick="closeModal()">Review first</button></div>
   `);
 }
}

let deferredInstallPrompt=null,wakeLock=null,confirmCallback=null,toastTimer=null;
function haptic(pattern=20){
 if(state.ui?.haptics!==false && navigator.vibrate)navigator.vibrate(pattern);
}
function showToast(msg){
 const el=document.getElementById('toast');if(!el)return;
 el.textContent=msg;el.classList.add('show');clearTimeout(toastTimer);
 toastTimer=setTimeout(()=>el.classList.remove('show'),1700);
}
function muscleChip(muscle){
 return `<span class="muscle-chip"><span class="muscle-dot"></span>${categoryIcon(muscle)} ${esc(muscle||'Other')}</span>`;
}
async function requestWakeLock(){
 if(state.ui?.keepAwake===false||!('wakeLock' in navigator))return;
 try{wakeLock=await navigator.wakeLock.request('screen');}catch(e){}
}
async function releaseWakeLock(){
 try{if(wakeLock)await wakeLock.release();}catch(e){} wakeLock=null;
}
function confirmAction(title,message,callback){
 confirmCallback=callback;
 openModal(title,`<div class="notice">${esc(message)}</div><div class="actions"><button class="btn danger" onclick="runConfirmedAction()">Confirm</button><button class="btn secondary" onclick="closeModal();confirmCallback=null">Cancel</button></div>`);
}
function runConfirmedAction(){
 const fn=confirmCallback;confirmCallback=null;closeModal();if(fn)fn();
}
function isNativeApp(){
 try{return !!window.Capacitor?.isNativePlatform?.()}catch(e){return false}
}
function nativePlatform(){
 try{return window.Capacitor?.getPlatform?.()||'web'}catch(e){return 'web'}
}
let appNavigationStack=['home'],nativeBackExitArmedUntil=0,nativeBehaviorReady=false;
function capacitorPlugin(name){
 try{return window.Capacitor?.Plugins?.[name]||null}catch(e){return null}
}
function syncViewportMetrics(){
 const h=Math.max(0,Math.round(window.visualViewport?.height||window.innerHeight||0));
 if(h)document.documentElement.style.setProperty('--sc-viewport-height',h+'px');
}
function scrollFocusedFieldIntoView(){
 const active=document.activeElement;
 if(active&&/^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName)){
   setTimeout(()=>{try{active.scrollIntoView({block:'center',behavior:'smooth'})}catch(e){}},60);
 }
}
async function configureNativeUi(){
 syncViewportMetrics();
 if(!isNativeApp()||nativePlatform()!=='android')return;
 const statusBar=capacitorPlugin('StatusBar');
 const keyboard=capacitorPlugin('Keyboard');
 try{await statusBar?.setStyle?.({style:'LIGHT'})}catch(e){}
 try{await statusBar?.setBackgroundColor?.({color:'#0b0e14'})}catch(e){}
 try{await statusBar?.setOverlaysWebView?.({overlay:true})}catch(e){}
 try{await keyboard?.setResizeMode?.({mode:'native'})}catch(e){}
 try{
   await keyboard?.addListener?.('keyboardWillShow',info=>{
     const height=Math.max(0,Number(info?.keyboardHeight)||0);
     document.documentElement.style.setProperty('--sc-keyboard-height',height+'px');
     document.body.classList.add('keyboard-open');
     scrollFocusedFieldIntoView();
   });
   await keyboard?.addListener?.('keyboardWillHide',()=>{
     document.documentElement.style.setProperty('--sc-keyboard-height','0px');
     document.body.classList.remove('keyboard-open');
   });
 }catch(e){}
}
function verifyDeviceStorageWritable(){
 if(storageWriteBlocked)return false;
 try{
   const key='__swole_cat_storage_probe__';
   swoleCatStorage.setItem(key,'ok');
   if(swoleCatStorage.getItem(key)!=='ok')throw new Error('Local storage probe could not be verified.');
   swoleCatStorage.removeItem(key);
   return true;
 }catch(e){
   storageWriteBlocked=true;
   lastStorageError=e?.message||String(e);
   startupStorageNotice='Swole Cat cannot safely write to its local device storage. Existing data has not been intentionally replaced. Free device storage or check app storage settings before logging more workouts.';
   return false;
 }
}
function recordAppNavigation(id,{history=true,replaceHistory=false,resetHistory=false}={}){
 if(resetHistory){appNavigationStack=[id];return}
 if(replaceHistory){
   if(appNavigationStack.length)appNavigationStack[appNavigationStack.length-1]=id;
   else appNavigationStack=[id];
   return;
 }
 if(!history)return;
 if(appNavigationStack[appNavigationStack.length-1]!==id)appNavigationStack.push(id);
 if(appNavigationStack.length>30)appNavigationStack=appNavigationStack.slice(-30);
}
function closeTransientUiForBack(){
 const selectOverlay=document.getElementById('appSelectOverlay');
 if(selectOverlay?.classList.contains('open')){closeAppSelect();return true}
 const modal=document.getElementById('modal');
 if(modal?.classList.contains('open')){
   confirmCallback=null;
   closeModal();
   return true;
 }
 const active=document.activeElement;
 if(active&&active!==document.body&&/^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName)){
   try{active.blur()}catch(e){}
   return true;
 }
 return false;
}
function navigateBackInApp(){
 const current=activeViewId();
 while(appNavigationStack.length>1&&appNavigationStack[appNavigationStack.length-1]===current)appNavigationStack.pop();
 const previous=appNavigationStack[appNavigationStack.length-1];
 if(previous&&previous!==current){
   go(previous,{history:false});
   return true;
 }
 if(current!=='home'){
   appNavigationStack=['home'];
   go('home',{history:false});
   return true;
 }
 return false;
}
function handleNativeBackButton(){
 if(closeTransientUiForBack())return;
 if(navigateBackInApp()){nativeBackExitArmedUntil=0;return}
 const appPlugin=capacitorPlugin('App');
 const now=Date.now();
 if(now<nativeBackExitArmedUntil){
   nativeBackExitArmedUntil=0;
   try{appPlugin?.exitApp?.()}catch(e){}
   return;
 }
 nativeBackExitArmedUntil=now+2000;
 showToast('Press back again to exit Swole Cat');
}
async function installNativeBehaviorHandlers(){
 if(nativeBehaviorReady||!isNativeApp()||nativePlatform()!=='android')return;
 const appPlugin=capacitorPlugin('App');
 if(!appPlugin?.addListener)return;
 nativeBehaviorReady=true;
 try{
   await appPlugin.addListener('backButton',()=>handleNativeBackButton());
   await appPlugin.addListener('appStateChange',({isActive})=>{
     if(!isActive){
       if(pendingStateSave)flushPendingStateSave();
       else if(state.activeWorkout)saveActiveWorkout();
       releaseWakeLock();
       nativeBackExitArmedUntil=0;
     }else{
       nativeBackExitArmedUntil=0;
       if(state.activeWorkout&&!state.activeWorkout.pausedAt)requestWakeLock();
       updateActiveWorkoutChrome();
     }
   });
 }catch(e){nativeBehaviorReady=false}
}
function updateInstallButton(){
 const b=document.getElementById('installBtn');
 if(b)b.classList.toggle('show',!isNativeApp()&&!!deferredInstallPrompt);
}
async function installApp(){
 if(!deferredInstallPrompt){showToast('Install option is not available in this browser yet.');return;}
 deferredInstallPrompt.prompt();
 try{await deferredInstallPrompt.userChoice;}catch(e){}
 deferredInstallPrompt=null;updateInstallButton();
}
function onboarding(){
 openModal('Welcome to Swole Cat',`
 <div class="onboard-hero"><div class="onboard-logo">🐱</div><div class="eyebrow">${isNativeApp()?'ANDROID · LOCAL. FAST. YOURS.':'LOCAL. FAST. YOURS.'}</div><h1 style="font-size:1.8rem;margin:7px 0">Train, log, progress.</h1><div class="muted">No account, no subscription, no cloud workout profile. Your training data stays on this device.</div></div>
 ${isNativeApp()?'<div class="notice"><b>Already use the Swole Cat PWA?</b><br>Android app storage is separate from the browser version. Export a backup from the PWA first, then import it here to bring over your routines, workouts, programs, PRs, preferences, and bodyweight history.</div>':''}
 <div class="onboard-step"><div class="num">1</div><div><b>Choose your path</b><div class="mini">Tell Coach Swolecat what you want to train, or build a workout manually if you already know exactly what you want.</div></div></div>
 <div class="onboard-step"><div class="num">2</div><div><b>Log what actually happened</b><div class="mini">Weight, reps, optional RIR, substitutions, rest timing, and notes.</div></div></div>
 <div class="onboard-step"><div class="num">3</div><div><b>Come back with context</b><div class="mini">Your previous numbers, workout recaps, muscle coverage, and progression history stay ready for the next session.</div></div></div>
 <div class="field"><label>Your name (optional)</label><input id="onName" value="${escAttr(state.profile.name||'')}" placeholder="Jake"></div>
 <div class="field"><label>Units</label><select id="onUnit"><option value="lb" ${state.profile.unit==='lb'?'selected':''}>Pounds (lb)</option><option value="kg" ${state.profile.unit==='kg'?'selected':''}>Kilograms (kg)</option></select></div>
 <div class="actions">
   ${isNativeApp()?'<label class="btn secondary" style="display:inline-block;margin:0">Import existing Swole Cat backup<input type="file" accept=".json,application/json" onchange="importBackup(this.files[0],this)" style="display:none"></label>':''}
   <button class="btn" onclick="finishOnboarding()">Enter Swolecat</button>
 </div>
 `);
}
function finishOnboarding(){
 state.profile.name=document.getElementById('onName').value.trim();
 state.profile.unit=document.getElementById('onUnit').value;
 state.ui.onboardingDone=true;save();closeModal();
 renderHome();showToast('You’re ready to train.');
}

function allExercises(){return exerciseCatalog().list;}
function exById(id){return exerciseCatalog().byId.get(id);}
function fmtWeight(w){return `${Number(w||0)} ${state.profile.unit}`;}

function activeWorkoutCounts(w=state.activeWorkout){
 if(!w)return {total:0,done:0,pct:0,skipped:0,activeExercises:0};
 const active=(w.exercises||[]).filter(e=>!e.skipped);
 const total=active.reduce((n,e)=>n+(e.sets||[]).length,0);
 const done=active.reduce((n,e)=>n+(e.sets||[]).filter(s=>s.done).length,0);
 const skipped=(w.exercises||[]).filter(e=>e.skipped).length;
 return {total,done,pct:total?Math.round(done/total*100):0,skipped,activeExercises:active.length};
}
function markWorkoutStructureDirty(){
 if(!state.activeWorkout)return;
 state.activeWorkout.structureDirty=true;
 saveActiveWorkout();
}
function clearWorkoutStructureDirty(){
 if(!state.activeWorkout)return;
 state.activeWorkout.structureDirty=false;
 saveActiveWorkout();
}
function saveActiveWorkout(defer=false){
 if(state.activeWorkout){
   state.activeWorkout.status='active';
   state.activeWorkout.lastSavedAt=new Date().toISOString();
 }
 return defer?scheduleStateSave():save();
}
function saveActiveWorkoutWithoutExtendingPendingSave(delay=90){
 if(state.activeWorkout){
   state.activeWorkout.status='active';
   state.activeWorkout.lastSavedAt=new Date().toISOString();
 }
 if(pendingStateSaveTimer){
   pendingStateSave=true;
   return true;
 }
 return scheduleStateSave(delay);
}
function workoutHeaderIcon(stateName){
 if(stateName==='pause'){
   return '<svg class="header-control-svg" data-icon="pause" viewBox="0 0 20 20" aria-hidden="true"><rect x="5" y="4" width="3.5" height="12" rx="1"/><rect x="11.5" y="4" width="3.5" height="12" rx="1"/></svg>';
 }
 return '<svg class="header-control-svg" data-icon="play" viewBox="0 0 20 20" aria-hidden="true"><path d="M6.2 4.2 15.2 10l-9 5.8z"/></svg>';
}
function activeViewId(){return document.querySelector('.view.active')?.id||'home'}
function updateActiveWorkoutChrome(){
 const btn=document.getElementById('resumeWorkoutBtn');
 if(!btn)return;
 if(!state.activeWorkout){
   btn.classList.remove('show');
   btn.removeAttribute('data-state');
   btn.removeAttribute('aria-label');
   btn.removeAttribute('title');
   btn.innerHTML='';
   return;
 }
 const counts=activeWorkoutCounts();
 const showPause=activeViewId()==='workout'&&!state.activeWorkout.pausedAt;
 const controlState=showPause?'pause':'resume';
 const verb=showPause?'Pause':'Resume';
 btn.dataset.state=controlState;
 btn.innerHTML=workoutHeaderIcon(controlState);
 btn.title=`${verb} ${state.activeWorkout.routineName} · ${counts.done} of ${counts.total} sets complete`;
 btn.setAttribute('aria-label',btn.title);
 btn.classList.add('show');
}
function pauseActiveWorkout(){
 const w=state.activeWorkout;
 if(!w){showToast('No active workout');return}
 if(!w.pausedAt)w.pausedAt=new Date().toISOString();
 saveActiveWorkout();
 stopRestTimer();
 releaseWakeLock();
 go('home',{replaceHistory:true});
 updateActiveWorkoutChrome();
 showToast('Workout paused');
}
function resumeActiveWorkout(){
 const w=state.activeWorkout;
 if(!w){showToast('No active workout');go('home');return}
 if(w.pausedAt){
   const pausedAt=new Date(w.pausedAt).getTime();
   if(Number.isFinite(pausedAt))w.pausedDurationMs=(Number(w.pausedDurationMs)||0)+Math.max(0,Date.now()-pausedAt);
   w.pausedAt=null;
 }
 saveActiveWorkout();
 requestWakeLock();
 renderWorkout();
 go('workout');
 updateActiveWorkoutChrome();
 showToast('Workout resumed');
}
function toggleActiveWorkoutControl(){
 if(!state.activeWorkout){showToast('No active workout');return}
 const shouldPause=activeViewId()==='workout'&&!state.activeWorkout.pausedAt;
 if(shouldPause)pauseActiveWorkout();
 else resumeActiveWorkout();
}
function activeSetsFromRoutineExercise(re,rec,ex){
 const working=Array.from({length:re.sets},(_,i)=>({
   weight:rec.weights?.[i]??rec.weight??0,
   reps:rec.targetReps?.[i]??re.minReps,
   done:false,rir:'',type:'working',pr:'',
   amrap:!!re.lastSetAmrap&&i===Math.max(0,re.sets-1)
 }));
 if(!re.autoWarmup||!ex||!COACH_COMPOUND_PATTERNS.has(ex.pattern))return working;
 const targetWeight=Number(rec.weights?.[0]??rec.weight??0);
 let warmups=warmupGuide(targetWeight,ex);
 if(!warmups.length&&ex.equipment!=='bodyweight'){
   warmups=[{weight:0,reps:8},{weight:0,reps:5}];
 }
 return [
   ...warmups.map(row=>({weight:row.weight,reps:row.reps,done:false,rir:'',type:'warmup',pr:'',amrap:false})),
   ...working
 ];
}
function startRoutineFresh(id,programId=null){
 const r=state.routines.find(x=>x.id===id); if(!r)return;
 const program=programId?programById(programId):null;
 const programMode=normalizeProgramTrainingMode(program?.trainingMode);
 const effectiveMode=programMode!=='inherit'?normalizeTrainingMode(programMode):normalizeTrainingMode(r.trainingMode);
 const now=new Date().toISOString();
 const active={
   id:uid(),routineId:id,routineName:r.name,trainingMode:effectiveMode,programId:programId||null,startDate:now,status:'active',lastSavedAt:now,structureDirty:false,pausedAt:null,pausedDurationMs:0,
   exercises:r.exercises.map((re,routineIndex)=>{
     const prev=previousExercise(re.exerciseId);
     const mode=effectiveMode,config={trainingGoal:'general',resetPercent:7.5,...re,routineMode:mode,mode:re.mode==='range'?'double':re.mode};
     const rec=buildRecommendation(config,prev,re.exerciseId);
     return {exerciseId:re.exerciseId,routineIndex,config,targetOverride:null,supersetId:re.supersetGroup||null,skipped:false,expanded:routineIndex===0,sets:activeSetsFromRoutineExercise(re,rec,exById(re.exerciseId)),notes:''};
   })
 };
 state.activeWorkout=active;
 saveActiveWorkout();
 updateActiveWorkoutChrome();
 requestWakeLock();haptic([20,35,20]);renderWorkout();go('workout');showToast('Workout started');
}
function discardActiveAndStart(id,programId=null){
 const next=state.routines.find(x=>x.id===id);if(!next)return;
 const oldName=state.activeWorkout?.routineName||'current workout';
 closeModal();
 confirmAction('Discard active workout?',`This permanently deletes the active ${oldName} draft and starts ${next.name}. Completed history is not affected.`,()=>{
   state.activeWorkout=null;save();updateActiveWorkoutChrome();startRoutineFresh(id,programId);
 });
}

function go(id,options={}){
 haptic(8);
 const target=document.getElementById(id);if(!target)return;
 const previous=activeViewId();
 document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
 target.classList.add('active');
 if(previous!==id)recordAppNavigation(id,options);
 document.querySelectorAll('.navbtn').forEach(b=>{const on=b.dataset.go===id;b.classList.toggle('active',on);if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
 // First visit needs content immediately. Revisits paint cached DOM first, then refresh
 // stale data on the next frame so taps are never blocked by rendering or storage.
 if(navigationRenderRevision[id]<0)renderNavigationView(id);
 else queueNavigationRefresh(id);
 updateActiveWorkoutChrome();
 window.scrollTo({top:0,behavior:'auto'});
}

