export interface ScaffoldFile {
  path: string; // project-relative, forward slashes
  content: string;
}

export interface ScaffoldResult {
  files: ScaffoldFile[];
  notes: string[];
}

export const UNITY_KINDS = [
  "monobehaviour",
  "scriptableobject",
  "editor_window",
  "test",
] as const;
export const UNREAL_KINDS = ["actor", "actor_component", "uobject", "subsystem"] as const;

export type UnityKind = (typeof UNITY_KINDS)[number];
export type UnrealKind = (typeof UNREAL_KINDS)[number];

/** Force a string into a valid C#/C++ identifier (PascalCase-ish, letter-led). */
export function sanitizeIdentifier(raw: string): string {
  let s = raw.replace(/[^A-Za-z0-9_]/g, "");
  if (s.length === 0) s = "Unnamed";
  if (/^[0-9]/.test(s)) s = `_${s}`;
  return s;
}

function unityNamespaceBlock(namespace: string | undefined, body: string): string {
  if (!namespace) return body;
  const indented = body
    .split("\n")
    .map((l) => (l.length ? `    ${l}` : l))
    .join("\n");
  return `namespace ${namespace}\n{\n${indented}\n}`;
}

export function scaffoldUnity(
  kind: UnityKind,
  name: string,
  namespace?: string
): ScaffoldResult {
  const n = sanitizeIdentifier(name);
  const ns = namespace && namespace.trim() ? namespace.trim() : undefined;
  const notes: string[] = [];

  switch (kind) {
    case "monobehaviour": {
      const body = `using UnityEngine;

public class ${n} : MonoBehaviour
{
    private void Awake()
    {
    }

    private void Start()
    {
    }

    private void Update()
    {
    }
}`;
      // Namespaces in Unity wrap the class but the using stays at top; handle that:
      const content = ns
        ? `using UnityEngine;\n\n${unityNamespaceBlock(
            ns,
            `public class ${n} : MonoBehaviour\n{\n    private void Awake()\n    {\n    }\n\n    private void Start()\n    {\n    }\n\n    private void Update()\n    {\n    }\n}`
          )}\n`
        : `${body}\n`;
      return { files: [{ path: `Assets/Scripts/${n}.cs`, content }], notes };
    }
    case "scriptableobject": {
      const menu = ns ? `${ns}/${n}` : `Game/${n}`;
      const classBody = `[CreateAssetMenu(fileName = "${n}", menuName = "${menu}")]\npublic class ${n} : ScriptableObject\n{\n}`;
      const content = `using UnityEngine;\n\n${
        ns ? unityNamespaceBlock(ns, classBody) : classBody
      }\n`;
      notes.push("Right-click in the Project window → Create → " + menu + " to make an asset.");
      return { files: [{ path: `Assets/Scripts/${n}.cs`, content }], notes };
    }
    case "editor_window": {
      const classBody = `public class ${n} : EditorWindow\n{\n    [MenuItem("Tools/${n}")]\n    public static void Open() => GetWindow<${n}>("${n}");\n\n    private void OnGUI()\n    {\n        EditorGUILayout.LabelField("${n}");\n    }\n}`;
      const content = `using UnityEditor;\nusing UnityEngine;\n\n${
        ns ? unityNamespaceBlock(`${ns}.Editor`, classBody) : classBody
      }\n`;
      notes.push("Editor scripts must live under an Editor/ folder — placed at Assets/Editor/.");
      return { files: [{ path: `Assets/Editor/${n}.cs`, content }], notes };
    }
    case "test": {
      const classBody = `public class ${n}\n{\n    [Test]\n    public void ${n}_Passes()\n    {\n        Assert.Pass();\n    }\n}`;
      const content = `using NUnit.Framework;\n\n${
        ns ? unityNamespaceBlock(`${ns}.Tests`, classBody) : classBody
      }\n`;
      notes.push(
        "Requires a Test Assembly Definition (.asmdef) referencing the Unity Test Framework in Assets/Tests/."
      );
      return { files: [{ path: `Assets/Tests/${n}.cs`, content }], notes };
    }
  }
}

export function scaffoldUnreal(
  kind: UnrealKind,
  name: string,
  moduleName = "Game"
): ScaffoldResult {
  const n = sanitizeIdentifier(name);
  const mod = sanitizeIdentifier(moduleName);
  const api = `${mod.toUpperCase()}_API`;
  const notes: string[] = [
    `Generated for module "${mod}" (API macro ${api}). Adjust the module name with the "module" argument if yours differs.`,
    "After adding new C++ files, regenerate project files and rebuild (Unreal will not see them until you do).",
  ];
  const headerPath = `Source/${mod}/Public/${n}.h`;
  const sourcePath = `Source/${mod}/Private/${n}.cpp`;

  switch (kind) {
    case "actor": {
      const header = `#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "${n}.generated.h"

UCLASS()
class ${api} A${n} : public AActor
{
    GENERATED_BODY()

public:
    A${n}();

protected:
    virtual void BeginPlay() override;

public:
    virtual void Tick(float DeltaSeconds) override;
};
`;
      const source = `#include "${n}.h"

A${n}::A${n}()
{
    PrimaryActorTick.bCanEverTick = true;
}

void A${n}::BeginPlay()
{
    Super::BeginPlay();
}

void A${n}::Tick(float DeltaSeconds)
{
    Super::Tick(DeltaSeconds);
}
`;
      return { files: [{ path: headerPath, content: header }, { path: sourcePath, content: source }], notes };
    }
    case "actor_component": {
      const header = `#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "${n}.generated.h"

UCLASS(ClassGroup=(Custom), meta=(BlueprintSpawnableComponent))
class ${api} U${n} : public UActorComponent
{
    GENERATED_BODY()

public:
    U${n}();

protected:
    virtual void BeginPlay() override;

public:
    virtual void TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) override;
};
`;
      const source = `#include "${n}.h"

U${n}::U${n}()
{
    PrimaryComponentTick.bCanEverTick = true;
}

void U${n}::BeginPlay()
{
    Super::BeginPlay();
}

void U${n}::TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction)
{
    Super::TickComponent(DeltaTime, TickType, ThisTickFunction);
}
`;
      return { files: [{ path: headerPath, content: header }, { path: sourcePath, content: source }], notes };
    }
    case "uobject": {
      const header = `#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "${n}.generated.h"

UCLASS(BlueprintType)
class ${api} U${n} : public UObject
{
    GENERATED_BODY()
};
`;
      return { files: [{ path: headerPath, content: header }], notes };
    }
    case "subsystem": {
      const header = `#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "${n}.generated.h"

UCLASS()
class ${api} U${n} : public UGameInstanceSubsystem
{
    GENERATED_BODY()

public:
    virtual void Initialize(FSubsystemCollectionBase& Collection) override;
    virtual void Deinitialize() override;
};
`;
      const source = `#include "${n}.h"

void U${n}::Initialize(FSubsystemCollectionBase& Collection)
{
    Super::Initialize(Collection);
}

void U${n}::Deinitialize()
{
    Super::Deinitialize();
}
`;
      notes.push("Access at runtime via GetGameInstance()->GetSubsystem<U" + n + ">().");
      return { files: [{ path: headerPath, content: header }, { path: sourcePath, content: source }], notes };
    }
  }
}
